import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { useQueryClient } from '@tanstack/react-query'

import { recordingsApi } from '@/api/recordings'
import {
    getPendingRecordings,
    updatePendingRecording,
    deletePendingRecording,
    getPendingRecordingByLocalId,
    getPendingEdits,
    deletePendingEdit,
    getDb,
} from '@/utils/recording-queue'
import { RECORDINGS_KEY } from '@/queries/useRecordingsQuery'

interface SyncContextValue {
    pendingCount: number
    isSyncing: boolean
    processQueue: () => Promise<void>
    refreshPendingCount: () => Promise<number>
}

const SyncContext = createContext<SyncContextValue>({
    pendingCount: 0,
    isSyncing: false,
    processQueue: async () => {},
    refreshPendingCount: async () => 0,
})

const POLL_INTERVAL_MS = 5000

export function SyncProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient()
    const [pendingCount, setPendingCount] = useState(0)
    const [isSyncing, setIsSyncing] = useState(false)
    const isSyncingRef = useRef(false)

    const refreshPendingCount = useCallback(async () => {
        const pending = await getPendingRecordings()
        setPendingCount(pending.length)
        return pending.length
    }, [])

    // ── Initialize DB + load count on mount ──────────────────────────────────
    useEffect(() => {
        getDb().then(() => refreshPendingCount())
    }, [refreshPendingCount])

    // ── Process upload queue ─────────────────────────────────────────────────
    const processUploadQueue = useCallback(async () => {
        const pending = await getPendingRecordings()
        const toUpload = pending.filter((r) => r.syncStatus === 'pending')

        for (const recording of toUpload) {
            await updatePendingRecording(recording.localId, { syncStatus: 'uploading' })

            try {
                await recordingsApi.upload({
                    uri: recording.audioUri,
                    duration: recording.duration,
                    recordedAt: recording.recordedAt,
                    localId: recording.localId,
                    transcript: recording.transcript ?? undefined,
                    folderId: recording.folderId ?? undefined,
                })

                // Check if recording was deleted while uploading
                const stillExists = await getPendingRecordingByLocalId(recording.localId)
                if (stillExists) {
                    await deletePendingRecording(recording.localId)
                }
            } catch {
                // Reset to pending so it retries next time
                await updatePendingRecording(recording.localId, { syncStatus: 'pending' })
            }
        }
    }, [])

    // ── Process edit queue ───────────────────────────────────────────────────
    const processEditQueue = useCallback(async () => {
        const edits = await getPendingEdits()

        for (const edit of edits) {
            try {
                if (edit.type === 'delete') {
                    await recordingsApi.delete(edit.recordingId)
                } else if (edit.type === 'update' && edit.changes) {
                    const changes = JSON.parse(edit.changes) as Record<string, unknown>
                    await recordingsApi.update(
                        edit.recordingId,
                        changes as { title?: string; folderId?: number }
                    )
                }
                await deletePendingEdit(edit.id)
            } catch {
                // Leave in queue for next retry
            }
        }
    }, [])

    // ── Main sync function ───────────────────────────────────────────────────
    const processQueue = useCallback(async () => {
        if (isSyncingRef.current) return

        // Check connectivity before attempting
        const netState = await NetInfo.fetch()
        if (!netState.isConnected) return

        isSyncingRef.current = true
        setIsSyncing(true)

        try {
            await processUploadQueue()
            await processEditQueue()
            queryClient.invalidateQueries({ queryKey: RECORDINGS_KEY })
            await refreshPendingCount()
        } finally {
            isSyncingRef.current = false
            setIsSyncing(false)
        }
    }, [processUploadQueue, processEditQueue, queryClient, refreshPendingCount])

    // ── Listen for connectivity changes ──────────────────────────────────────
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            if (state.isConnected && state.isInternetReachable !== false) {
                processQueue()
            }
        })

        return unsubscribe
    }, [processQueue])

    // ── Poll when pending items exist ────────────────────────────────────────
    // Fallback for when NetInfo misses connectivity changes (common in simulator)
    useEffect(() => {
        if (pendingCount === 0) return

        const interval = setInterval(() => {
            processQueue()
        }, POLL_INTERVAL_MS)

        return () => clearInterval(interval)
    }, [pendingCount, processQueue])

    // ── Process queue when app comes to foreground ───────────────────────────
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                processQueue()
            }
        })

        return () => subscription.remove()
    }, [processQueue])

    return (
        <SyncContext.Provider value={{ pendingCount, isSyncing, processQueue, refreshPendingCount }}>
            {children}
        </SyncContext.Provider>
    )
}

export function useSync(): SyncContextValue {
    return useContext(SyncContext)
}
