import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useRecordingsQuery, RECORDINGS_KEY } from '@/queries/useRecordingsQuery'
import {
    getPendingRecordings,
    updatePendingRecording,
    deletePendingRecording,
    getPendingEdits,
    insertPendingEdit,
} from '@/utils/recording-queue'
import { recordingsApi } from '@/api/recordings'
import { useSync } from '@/contexts/SyncContext'

import type { Recording, PendingRecording, PendingEdit } from '@/types/recording.types'

// ── Convert a pending recording to the unified Recording shape ───────────────

function pendingToRecording(pending: PendingRecording): Recording {
    return {
        id: 0,
        localId: pending.localId,
        folderId: pending.folderId,
        title: pending.title,
        transcript: pending.transcript,
        audioFormat: 'm4a',
        fileSize: 0,
        duration: pending.duration,
        waveformData: null,
        status: 'uploading',
        syncStatus: pending.syncStatus,
        recordedAt: pending.recordedAt,
        createdAt: pending.createdAt,
    }
}

// ── Context ──────────────────────────────────────────────────────────────────

interface RecordingsContextValue {
    recordings: Recording[]
    isLoading: boolean
    refetch: () => void
    editRecording: (recording: Recording, changes: { title?: string; folderId?: number }) => Promise<void>
    deleteRecording: (recording: Recording) => Promise<void>
}

const RecordingsContext = createContext<RecordingsContextValue>({
    recordings: [],
    isLoading: true,
    refetch: () => {},
    editRecording: async () => {},
    deleteRecording: async () => {},
})

export function RecordingsProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient()
    const { data: serverData, isLoading: serverLoading, refetch } = useRecordingsQuery()
    const { processQueue } = useSync()

    const [pendingRecordings, setPendingRecordings] = useState<PendingRecording[]>([])
    const [pendingEdits, setPendingEdits] = useState<PendingEdit[]>([])

    // ── Load pending data from SQLite ────────────────────────────────────────

    const refreshPending = useCallback(async () => {
        const [recordings, edits] = await Promise.all([getPendingRecordings(), getPendingEdits()])
        setPendingRecordings(recordings)
        setPendingEdits(edits)
    }, [])

    useEffect(() => {
        refreshPending()
    }, [refreshPending])

    // Re-read pending whenever server data changes (an upload may have completed)
    useEffect(() => {
        refreshPending()
    }, [serverData, refreshPending])

    // ── Merge recordings ─────────────────────────────────────────────────────

    const recordings = useMemo(() => {
        const serverRecordings: Recording[] = (serverData?.data ?? []).map((r) => ({
            ...r,
            localId: r.localId ?? null,
            transcript: r.transcript ?? null,
            syncStatus: 'synced' as const,
        }))

        // Apply pending edits to server recordings
        const withEditsApplied = serverRecordings.map((r) => {
            const edit = pendingEdits.find((e) => e.recordingId === r.id && e.type === 'update')
            if (edit?.changes) {
                const changes = JSON.parse(edit.changes) as Record<string, unknown>
                return { ...r, ...changes } as Recording
            }
            return r
        })

        // Filter out server recordings that have pending deletes
        const deletedIds = new Set(
            pendingEdits.filter((e) => e.type === 'delete').map((e) => e.recordingId)
        )
        const filteredServer = withEditsApplied.filter((r) => !deletedIds.has(r.id))

        // Filter out pending recordings that already exist on the server
        const serverLocalIds = new Set(filteredServer.map((r) => r.localId).filter(Boolean))
        const stillPending = pendingRecordings
            .filter((r) => !serverLocalIds.has(r.localId))
            .map(pendingToRecording)

        return [...stillPending, ...filteredServer]
    }, [serverData, pendingRecordings, pendingEdits])

    // ── Edit a recording (works for both pending and server) ─────────────────

    const editRecording = useCallback(
        async (recording: Recording, changes: { title?: string; folderId?: number }) => {
            if (recording.syncStatus !== 'synced') {
                // Pending recording — update SQLite directly
                await updatePendingRecording(recording.localId!, changes)
                await refreshPending()
            } else {
                // Server recording — optimistic update + queue for sync
                queryClient.setQueryData(RECORDINGS_KEY, (old: typeof serverData) => {
                    if (!old) return old
                    return {
                        ...old,
                        data: old.data.map((r: Recording) =>
                            r.id === recording.id ? { ...r, ...changes } : r
                        ),
                    }
                })
                await insertPendingEdit(recording.id, 'update', changes)
                await refreshPending()
                processQueue()
            }
        },
        [queryClient, serverData, refreshPending, processQueue]
    )

    // ── Delete a recording (works for both pending and server) ───────────────

    const deleteRecording = useCallback(
        async (recording: Recording) => {
            if (recording.syncStatus !== 'synced') {
                // Pending recording — just remove from SQLite
                await deletePendingRecording(recording.localId!)
                await refreshPending()
            } else {
                // Server recording — optimistic removal + queue for sync
                queryClient.setQueryData(RECORDINGS_KEY, (old: typeof serverData) => {
                    if (!old) return old
                    return {
                        ...old,
                        data: old.data.filter((r: Recording) => r.id !== recording.id),
                    }
                })
                await insertPendingEdit(recording.id, 'delete')
                await refreshPending()
                processQueue()
            }
        },
        [queryClient, serverData, refreshPending, processQueue]
    )

    const isLoading = serverLoading && pendingRecordings.length === 0

    return (
        <RecordingsContext.Provider
            value={{ recordings, isLoading, refetch, editRecording, deleteRecording }}
        >
            {children}
        </RecordingsContext.Provider>
    )
}

export function useRecordings(): RecordingsContextValue {
    return useContext(RecordingsContext)
}
