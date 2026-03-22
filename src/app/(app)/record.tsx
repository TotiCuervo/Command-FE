import { View, Text, StyleSheet, StatusBar } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { PressableScale } from 'pressto'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Transition from 'react-native-screen-transitions'

import { colors, font, spacing } from '@/constants/theme'
import { useRecorder } from '@/contexts/RecorderContext'
import { useRecordingPreferences } from '@/hooks/useRecordingPreferences'
import { WaveformViz } from '@/components/recordings/WaveformViz'
import { MinimalViz } from '@/components/recordings/MinimalViz'
import { formatTimer } from '@/utils/format-recording'

// ─── RecordScreen ─────────────────────────────────────────────────────────────

export default function RecordScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const { prefs } = useRecordingPreferences()

    const { isRecording, isSaving, elapsed, amplitudes, dotOpacity, start, stop, cancel } = useRecorder()

    const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }))

    // Auto-start recording when screen mounts
    useEffect(() => {
        start()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleStop = async () => {
        await stop()
        // Navigate to the review/detail screen for this recording
        // The reviewData will be available via RecorderContext
        router.replace('/(app)/review')
    }

    const handleCancel = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        cancel()
        router.back()
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <StatusBar barStyle="light-content" animated />

            {/* Top bar */}
            <View style={styles.topBar}>
                <PressableScale
                    style={styles.cancelBtn}
                    onPress={handleCancel}
                    enabled={!isSaving}
                    testID="record__cancel"
                >
                    <Text style={styles.cancelText}>Cancel</Text>
                </PressableScale>

                {isRecording && (
                    <Animated.View style={[styles.indicator, dotStyle]}>
                        <View style={styles.indicatorDot} />
                        <Text style={styles.indicatorText}>Recording</Text>
                    </Animated.View>
                )}
            </View>

            {/* Shared element: title that morphs to detail screen */}
            <Transition.View sharedBoundTag="recording-title" style={styles.titleWrap}>
                <Text style={styles.title} testID="record__title">
                    New Recording
                </Text>
            </Transition.View>

            {/* Timer */}
            <View style={styles.timerWrap}>
                <Text style={styles.timer} testID="record__timer">
                    {formatTimer(elapsed)}
                </Text>
            </View>

            {/* Visualization */}
            <View style={styles.vizWrap}>
                {prefs.vizMode === 'waveform' ? (
                    <WaveformViz amplitudes={amplitudes} testID="record__waveform" />
                ) : (
                    <MinimalViz isActive={isRecording} testID="record__minimal" />
                )}
            </View>

            {/* Status */}
            <Text style={styles.statusText}>
                {isSaving ? 'Saving…' : isRecording ? 'Listening…' : 'Starting…'}
            </Text>

            {/* Stop button */}
            <Transition.View sharedBoundTag="recording-action" style={styles.stopWrap}>
                <PressableScale
                    style={[styles.stopBtn, isSaving && styles.stopBtnDisabled]}
                    onPress={handleStop}
                    enabled={isRecording && !isSaving}
                    testID="record__stop"
                >
                    <View style={styles.stopIcon} />
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
        justifyContent: 'space-between',
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
    },
    cancelBtn: {
        paddingVertical: spacing.sm,
        paddingRight: spacing.sm,
    },
    cancelText: {
        fontFamily: font.family.regular,
        fontSize: font.size.md,
        color: colors.text.secondary,
    },
    indicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    indicatorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.accent.primary,
    },
    indicatorText: {
        fontFamily: font.family.medium,
        fontSize: font.size.sm,
        color: colors.accent.primary,
    },
    titleWrap: {
        paddingHorizontal: 0,
        paddingBottom: spacing.sm,
    },
    title: {
        fontFamily: font.family.bold,
        fontSize: font.size.xl,
        color: colors.white,
    },
    timerWrap: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    timer: {
        fontFamily: font.family.black,
        fontSize: 64,
        color: colors.white,
        letterSpacing: -2,
    },
    vizWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusText: {
        fontFamily: font.family.regular,
        fontSize: font.size.md,
        color: colors.text.secondary,
        textAlign: 'center',
        paddingBottom: spacing.xxl,
    },
    stopWrap: {
        alignItems: 'center',
        paddingBottom: spacing.xxxl,
    },
    stopBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stopBtnDisabled: {
        opacity: 0.5,
    },
    stopIcon: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: colors.black,
    },
})
