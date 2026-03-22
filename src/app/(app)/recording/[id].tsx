import { View, Text, TextInput, StyleSheet, StatusBar, Alert } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useState, useMemo } from 'react'
import { PressableScale } from 'pressto'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Transition from 'react-native-screen-transitions'

import { colors, font, spacing, radius } from '@/constants/theme'
import { useRecordings } from '@/contexts/RecordingsContext'
import { WaveformViz } from '@/components/recordings/WaveformViz'
import { formatTimer, formatDate } from '@/utils/format-recording'

// ─── RecordingDetailScreen ────────────────────────────────────────────────────

export default function RecordingDetailScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const { id } = useLocalSearchParams<{ id: string }>()

    const { recordings, editRecording, deleteRecording } = useRecordings()

    const recording = useMemo(
        () => recordings.find((r) => (r.localId ?? String(r.id)) === id),
        [recordings, id]
    )

    const [title, setTitle] = useState(recording?.title ?? 'Untitled Recording')
    const [isEditing, setIsEditing] = useState(false)

    if (!recording) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <StatusBar barStyle="light-content" animated />
                <Text style={styles.notFound}>Recording not found</Text>
                <PressableScale onPress={() => router.back()} testID="detail__back-fallback">
                    <Text style={styles.backText}>← Back</Text>
                </PressableScale>
            </View>
        )
    }

    const recordingId = recording.localId ?? String(recording.id)

    // Static waveform from waveformData or generate placeholder
    const staticAmplitudes: number[] = recording.waveformData
        ?? Array.from({ length: 40 }, (_, i) => {
              const center = 20
              const dist = Math.abs(i - center) / center
              return 0.2 + (1 - dist) * 0.4 + Math.random() * 0.2
          })

    const handleBack = () => {
        router.back()
    }

    const handleSaveTitle = async () => {
        if (title.trim() && title.trim() !== recording.title) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            await editRecording(recording, { title: title.trim() })
        }
        setIsEditing(false)
    }

    const handleDelete = () => {
        Alert.alert('Delete Recording', 'This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
                    await deleteRecording(recording)
                    router.back()
                },
            },
        ])
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <StatusBar barStyle="light-content" animated />

            {/* Top bar */}
            <View style={styles.topBar}>
                <PressableScale style={styles.backBtn} onPress={handleBack} testID="detail__back">
                    <Text style={styles.backText}>←</Text>
                </PressableScale>

                <PressableScale style={styles.deleteBtn} onPress={handleDelete} testID="detail__delete">
                    <Text style={styles.deleteText}>Delete</Text>
                </PressableScale>
            </View>

            {/* Title — shared element from list row */}
            <Transition.View sharedBoundTag={`recording-title-${recordingId}`} style={styles.titleWrap}>
                {isEditing ? (
                    <TextInput
                        style={styles.titleInput}
                        value={title}
                        onChangeText={setTitle}
                        onBlur={handleSaveTitle}
                        onSubmitEditing={handleSaveTitle}
                        autoFocus
                        selectTextOnFocus
                        testID="detail__title-input"
                    />
                ) : (
                    <PressableScale onPress={() => setIsEditing(true)} testID="detail__title">
                        <Text style={styles.title}>{title}</Text>
                    </PressableScale>
                )}
            </Transition.View>

            {/* Recording info */}
            <View style={styles.metaRow}>
                <Text style={styles.metaText}>{formatDate(recording.recordedAt ?? recording.createdAt)}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{formatTimer((recording.duration ?? 0) * 1000)}</Text>
            </View>

            {/* Transcript */}
            {recording.transcript ? (
                <View style={styles.transcriptWrap}>
                    <Text style={styles.transcriptLabel}>Transcript</Text>
                    <Text style={styles.transcriptText}>{recording.transcript}</Text>
                </View>
            ) : null}

            {/* Waveform */}
            <View style={styles.vizWrap}>
                <WaveformViz amplitudes={staticAmplitudes} testID="detail__waveform" />
            </View>

            {/* Playback controls placeholder */}
            <View style={styles.actionWrap}>
                <PressableScale style={styles.playBtn} testID="detail__play">
                    <Text style={styles.playBtnText}>▶ Play</Text>
                </PressableScale>
            </View>
        </View>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg.recording,
        paddingHorizontal: 20,
    },
    notFound: {
        fontFamily: font.family.regular,
        fontSize: font.size.lg,
        color: colors.text.secondary,
        textAlign: 'center',
        paddingTop: spacing.xxl,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
    },
    backBtn: {
        paddingVertical: spacing.sm,
        paddingRight: spacing.sm,
    },
    backText: {
        fontFamily: font.family.regular,
        fontSize: font.size.xl,
        color: colors.white,
    },
    deleteBtn: {
        paddingVertical: spacing.sm,
        paddingLeft: spacing.sm,
    },
    deleteText: {
        fontFamily: font.family.medium,
        fontSize: font.size.md,
        color: colors.accent.primary,
    },
    titleWrap: {
        paddingBottom: spacing.sm,
    },
    title: {
        fontFamily: font.family.bold,
        fontSize: font.size.xl,
        color: colors.white,
    },
    titleInput: {
        fontFamily: font.family.bold,
        fontSize: font.size.xl,
        color: colors.white,
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border.subtle,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingTop: spacing.xs,
        paddingBottom: spacing.xl,
    },
    metaText: {
        fontFamily: font.family.regular,
        fontSize: font.size.sm,
        color: colors.text.secondary,
    },
    metaDot: {
        fontFamily: font.family.regular,
        fontSize: font.size.sm,
        color: colors.text.secondary,
    },
    transcriptWrap: {
        paddingBottom: spacing.xl,
    },
    transcriptLabel: {
        fontFamily: font.family.semiBold,
        fontSize: font.size.sm,
        color: colors.text.secondary,
        paddingBottom: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    transcriptText: {
        fontFamily: font.family.regular,
        fontSize: font.size.md,
        color: colors.white,
        lineHeight: 22,
    },
    vizWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionWrap: {
        alignItems: 'center',
        paddingBottom: spacing.xxxl,
    },
    playBtn: {
        height: 56,
        paddingHorizontal: spacing.xxl,
        backgroundColor: colors.white,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 200,
    },
    playBtnText: {
        fontFamily: font.family.semiBold,
        fontSize: font.size.lg,
        color: colors.black,
    },
})
