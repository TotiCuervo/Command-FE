import { View, Text, TextInput, StyleSheet, StatusBar } from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { PressableScale } from 'pressto'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Transition from 'react-native-screen-transitions'

import { colors, font, spacing, radius } from '@/constants/theme'
import { useRecorder } from '@/contexts/RecorderContext'
import { useRecordings } from '@/contexts/RecordingsContext'
import { WaveformViz } from '@/components/recordings/WaveformViz'
import { formatTimer, formatDate } from '@/utils/format-recording'

// ─── ReviewScreen ─────────────────────────────────────────────────────────────

export default function ReviewScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()

    const { reviewData, reset } = useRecorder()
    const { recordings, editRecording } = useRecordings()

    const [title, setTitle] = useState(reviewData?.title ?? 'Untitled Recording')

    if (!reviewData) {
        // Should not happen — redirect back
        router.replace('/' as never)
        return null
    }

    // Use the last captured amplitude frame for a static waveform preview
    const staticAmplitudes =
        reviewData.amplitudeHistory.length > 0
            ? reviewData.amplitudeHistory[reviewData.amplitudeHistory.length - 1]
            : Array.from({ length: 40 }, () => 0.1)

    // Find the recording in context by localId
    const recording = recordings.find((r) => r.localId === reviewData.localId)

    const handleSave = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        if (recording && title.trim() && title.trim() !== 'Untitled Recording') {
            await editRecording(recording, { title: title.trim() })
        }
        reset()
        router.replace('/' as never)
    }

    const handleDiscard = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        // Recording is already saved to SQLite — this just goes back without renaming
        reset()
        router.replace('/' as never)
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <StatusBar barStyle="light-content" animated />

            {/* Top bar */}
            <View style={styles.topBar}>
                <PressableScale
                    style={styles.backBtn}
                    onPress={handleDiscard}
                    testID="review__back"
                >
                    <Text style={styles.backText}>←</Text>
                </PressableScale>
            </View>

            {/* Shared element: title morphing from record screen */}
            <Transition.View sharedBoundTag="recording-title" style={styles.titleWrap}>
                <TextInput
                    style={styles.titleInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Recording Name"
                    placeholderTextColor={colors.text.placeholder}
                    selectTextOnFocus
                    testID="review__title-input"
                />
            </Transition.View>

            {/* Recording info */}
            <View style={styles.metaRow}>
                <Text style={styles.metaText}>{formatDate(reviewData.recordedAt)}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{formatTimer(reviewData.duration * 1000)}</Text>
            </View>

            {/* Static waveform */}
            <View style={styles.vizWrap}>
                <WaveformViz amplitudes={staticAmplitudes} testID="review__waveform" />
            </View>

            {/* Save button */}
            <Transition.View sharedBoundTag="recording-action" style={styles.actionWrap}>
                <PressableScale style={styles.saveBtn} onPress={handleSave} testID="review__save">
                    <Text style={styles.saveBtnText}>Save</Text>
                </PressableScale>
            </Transition.View>
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
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
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
    titleWrap: {
        paddingBottom: spacing.sm,
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
    vizWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionWrap: {
        alignItems: 'center',
        paddingBottom: spacing.xxxl,
    },
    saveBtn: {
        height: 56,
        paddingHorizontal: spacing.xxl,
        backgroundColor: colors.white,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 200,
    },
    saveBtnText: {
        fontFamily: font.family.semiBold,
        fontSize: font.size.lg,
        color: colors.black,
    },
})
