import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
    useAudioRecorder,
    useAudioRecorderState,
    setAudioModeAsync,
    requestRecordingPermissionsAsync,
    RecordingPresets,
} from 'expo-audio'
import {
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    cancelAnimation,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useQueryClient } from '@tanstack/react-query'

import { insertPendingRecording } from '@/utils/recording-queue'
import { RECORDINGS_KEY } from '@/queries/useRecordingsQuery'
import { useSync } from '@/contexts/SyncContext'

import type { SharedValue } from 'react-native-reanimated'

const BAR_COUNT = 40

type RecorderPhase = 'idle' | 'recording' | 'review'

function generateLocalId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

// ── Saved recording data (available during review phase) ──────────────────────

export interface ReviewData {
    localId: string
    title: string | null
    duration: number
    amplitudeHistory: number[][]
    recordedAt: string
}

// ── Context Type ─────────────────────────────────────────────────────────────

interface RecorderContextValue {
    phase: RecorderPhase
    isRecording: boolean
    isSaving: boolean
    elapsed: number
    amplitudes: number[]
    dotOpacity: SharedValue<number>
    reviewData: ReviewData | null
    start: () => Promise<void>
    stop: () => Promise<void>
    cancel: () => void
    reset: () => void
}

const RecorderContext = createContext<RecorderContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────────────────────

export function RecorderProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient()
    const { processQueue, refreshPendingCount } = useSync()

    const [phase, setPhase] = useState<RecorderPhase>('idle')
    const [isRecording, setIsRecording] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [elapsed, setElapsed] = useState(0)
    const [amplitudes, setAmplitudes] = useState<number[]>(
        Array.from({ length: BAR_COUNT }, () => Math.random() * 0.15 + 0.05)
    )
    const [reviewData, setReviewData] = useState<ReviewData | null>(null)

    // Store amplitude snapshots for playback visualization in review
    const amplitudeHistoryRef = useRef<number[][]>([])

    const recordingOptions = useMemo(
        () => ({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true }),
        []
    )
    const recorder = useAudioRecorder(recordingOptions)
    const recorderState = useAudioRecorderState(recorder, 100)
    const recorderRef = useRef(recorder)
    recorderRef.current = recorder

    const startTimeRef = useRef(0)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const recordedAtRef = useRef('')

    const dotOpacity = useSharedValue(1)

    // ── Breathing idle animation ─────────────────────────────────────────────

    const breathe = useCallback(() => {
        setAmplitudes(
            Array.from({ length: BAR_COUNT }, (_, i) => {
                const center = BAR_COUNT / 2
                const dist = Math.abs(i - center) / center
                return (0.1 + (1 - dist) * 0.2) * (0.8 + Math.random() * 0.4)
            })
        )
    }, [])

    useEffect(() => {
        if (isRecording) return
        const id = setInterval(breathe, 800)
        return () => clearInterval(id)
    }, [isRecording, breathe])

    // ── Sync metering to waveform ────────────────────────────────────────────

    useEffect(() => {
        if (!isRecording || !recorderState.isRecording) return
        const level = recorderState.metering ?? -60
        const normalized = Math.max(0, Math.min(1, (level + 60) / 60))
        setAmplitudes((prev) => {
            const next = [...prev.slice(1)]
            next.push(Math.max(0.04, normalized))
            // Capture for review playback
            amplitudeHistoryRef.current.push([...next])
            return next
        })
    }, [isRecording, recorderState.isRecording, recorderState.metering])

    // ── Start ────────────────────────────────────────────────────────────────

    const start = useCallback(async () => {
        try {
            const { granted } = await requestRecordingPermissionsAsync()
            if (!granted) return

            await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
                interruptionMode: 'mixWithOthers',
                shouldPlayInBackground: true,
            })

            amplitudeHistoryRef.current = []

            await recorder.prepareToRecordAsync()
            recorder.record()

            recordedAtRef.current = new Date().toISOString()
            startTimeRef.current = Date.now()
            setIsRecording(true)
            setPhase('recording')
            setElapsed(0)

            dotOpacity.value = withRepeat(
                withSequence(withTiming(0.3, { duration: 600 }), withTiming(1, { duration: 600 })),
                -1,
                true
            )

            timerRef.current = setInterval(() => {
                setElapsed(Date.now() - startTimeRef.current)
            }, 100)
        } catch (err) {
            console.error('Failed to start recording', err)
        }
    }, [recorder, dotOpacity])

    // ── Stop + save to SQLite ────────────────────────────────────────────────

    const stop = useCallback(async () => {
        if (!isRecording || isSaving) return

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

        if (timerRef.current) clearInterval(timerRef.current)
        cancelAnimation(dotOpacity)
        dotOpacity.value = withTiming(0, { duration: 200 })
        setIsRecording(false)
        setIsSaving(true)

        try {
            const r = recorderRef.current
            const before = r.getStatus()
            await r.stop()
            const uri = r.uri ?? before.url
            if (!uri) throw new Error('Recording file not available')

            const durationSec = Math.max(1, Math.round(before.durationMillis / 1000))
            const localId = generateLocalId()

            const transcript: string | null = null

            await insertPendingRecording({
                localId,
                audioUri: uri,
                title: null,
                transcript,
                duration: durationSec,
                folderId: null,
                recordedAt: recordedAtRef.current,
                createdAt: new Date().toISOString(),
                syncStatus: 'pending',
            })

            await refreshPendingCount()
            queryClient.invalidateQueries({ queryKey: RECORDINGS_KEY })
            processQueue()

            // Transition to review phase
            setReviewData({
                localId,
                title: null,
                duration: durationSec,
                amplitudeHistory: amplitudeHistoryRef.current,
                recordedAt: recordedAtRef.current,
            })
            setPhase('review')
        } catch (err) {
            console.error('Failed to save recording', err)
        } finally {
            setIsSaving(false)
        }
    }, [dotOpacity, isRecording, isSaving, queryClient, processQueue, refreshPendingCount])

    // ── Cancel ───────────────────────────────────────────────────────────────

    const cancel = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current)
        cancelAnimation(dotOpacity)
        setIsRecording(false)
        setPhase('idle')
        setReviewData(null)
        void recorderRef.current.stop().catch(() => {})
    }, [dotOpacity])

    // ── Reset (after review is done) ─────────────────────────────────────────

    const reset = useCallback(() => {
        setPhase('idle')
        setReviewData(null)
        setElapsed(0)
        setAmplitudes(Array.from({ length: BAR_COUNT }, () => Math.random() * 0.15 + 0.05))
        amplitudeHistoryRef.current = []
    }, [])

    const value = useMemo<RecorderContextValue>(
        () => ({
            phase,
            isRecording,
            isSaving,
            elapsed,
            amplitudes,
            dotOpacity,
            reviewData,
            start,
            stop,
            cancel,
            reset,
        }),
        [phase, isRecording, isSaving, elapsed, amplitudes, dotOpacity, reviewData, start, stop, cancel, reset]
    )

    return <RecorderContext.Provider value={value}>{children}</RecorderContext.Provider>
}

export function useRecorder(): RecorderContextValue {
    const ctx = useContext(RecorderContext)
    if (!ctx) throw new Error('useRecorder must be used within RecorderProvider')
    return ctx
}
