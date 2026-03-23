import { useCallback, useRef } from 'react'
import {
    ActivityIndicator,
    Dimensions,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native'
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useDerivedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Transition, { useScreenAnimation } from 'react-native-screen-transitions'

import { colors, font, spacing } from '@/constants/theme'
import { formatTimer } from '@/utils/format-recording'
import { useRecorder } from '@/contexts/RecorderContext'

/** Must match `snapPoints` in `(app)/_layout.tsx`. */
const SNAP_SMALL = 0.3
const SNAP_FULL = 1

const CARD_INSET = 16
const CARD_RADIUS = 24

const iosContinuousCorners =
    Platform.OS === 'ios' ? ({ borderCurve: 'continuous' } as const) : null

function useEffectiveWindowHeight(): number {
    const { height } = useWindowDimensions()
    return Math.max(1, height || Dimensions.get('window').height)
}

export default function RecordingScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const windowHeight = useEffectiveWindowHeight()
    const animation = useScreenAnimation()
    /** Keeps `sharedBoundTag` stable through `stop()` (context clears `sessionLocalId` before navigation finishes). */
    const lastSessionIdForSharedBoundRef = useRef<string | null>(null)
    const {
        sessionLocalId,
        isRecording,
        isSaving,
        elapsed,
        dotOpacity,
        stop,
    } = useRecorder()

    const snapProgress = useDerivedValue(() => {
        const raw = animation.value.current.progress
        const closing = animation.value.current.closing
        const entering = animation.value.current.entering
        const animating = animation.value.current.animating
        const g = animation.value.current.gesture
        const interactive = g.isDragging > 0.5 || g.isDismissing > 0.5
        if (closing > 0.5 || interactive) return raw
        if (entering > 0.5 || animating > 0.5) return raw
        return Math.max(raw, SNAP_SMALL)
    })

    const shellStyle = useAnimatedStyle(() => {
        const p = snapProgress.value
        const floatBottom = CARD_INSET + insets.bottom
        const inset = interpolate(p, [SNAP_SMALL, SNAP_FULL], [CARD_INSET, 0], Extrapolation.CLAMP)
        const slideOffset = SNAP_SMALL * windowHeight + floatBottom

        let height: number
        let paddingBottom: number
        let translateY: number

        if (p <= SNAP_SMALL) {
            height = SNAP_SMALL * windowHeight
            paddingBottom = floatBottom
            translateY = interpolate(p, [0, SNAP_SMALL], [slideOffset, 0], Extrapolation.CLAMP)
        } else {
            height = p * windowHeight
            paddingBottom = interpolate(
                p,
                [SNAP_SMALL, SNAP_FULL],
                [floatBottom, 0],
                Extrapolation.CLAMP,
            )
            translateY = 0
        }

        return {
            height: Math.max(0, height),
            paddingHorizontal: inset,
            paddingBottom,
            paddingTop: 0,
            backgroundColor: 'transparent',
            alignSelf: 'stretch',
            transform: [{ translateY }],
        }
    }, [windowHeight, insets.bottom])

    const cardStyle = useAnimatedStyle(() => {
        const p = snapProgress.value
        const r = interpolate(p, [SNAP_SMALL, SNAP_FULL], [CARD_RADIUS, 0], Extrapolation.CLAMP)
        return {
            flex: 1,
            minHeight: 0,
            backgroundColor: colors.bg.primary,
            borderTopLeftRadius: r,
            borderTopRightRadius: r,
            borderBottomLeftRadius: r,
            borderBottomRightRadius: r,
            overflow: 'hidden',
        }
    })

    const dotStyle = useAnimatedStyle(() => ({
        opacity: dotOpacity.value,
    }))

    if (sessionLocalId != null) {
        lastSessionIdForSharedBoundRef.current = sessionLocalId
    }
    const sharedTitleTag =
        lastSessionIdForSharedBoundRef.current != null
            ? (`recording-title-${lastSessionIdForSharedBoundRef.current}` as const)
            : null

    const handleStop = useCallback(async () => {
        const id = await stop()
        if (id) {
            // Push (don't replace): replacing pops the sheet via `beforeRemove` → progress animates to 0
            // (looks like the recorder closing). Pushing keeps the record screen underneath during SharedAppleMusic.
            router.push({
                pathname: '/(app)/recording/[id]',
                params: { id, fromRecorder: '1' },
            })
        }
    }, [router, stop])

    return (
        <View style={styles.sheetRoot} pointerEvents="box-none">
            <Animated.View style={shellStyle}>
                <Animated.View style={[cardStyle, iosContinuousCorners]}>
                    <View
                        style={[
                            styles.inner,
                            {
                                paddingTop: Math.max(insets.top, spacing.lg),
                                paddingBottom: spacing.lg + insets.bottom,
                                paddingHorizontal: spacing.lg,
                            },
                        ]}
                    >
                        {sharedTitleTag ? (
                            <Transition.View sharedBoundTag={sharedTitleTag} style={styles.titleWrap}>
                                <Text style={styles.title}>New recording</Text>
                            </Transition.View>
                        ) : (
                            <Text style={styles.title}>New recording</Text>
                        )}

                        <View style={styles.center}>
                            <Animated.View style={[styles.recDot, dotStyle]} />
                        </View>

                        <View style={styles.controls}>
                            <View style={styles.ctrlBtn}>
                                <Text style={styles.ctrlIcon}>‖</Text>
                            </View>
                            <Pressable
                                style={[styles.ctrlBtn, styles.stopBtn]}
                                onPress={handleStop}
                                disabled={!isRecording || isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color={colors.white} />
                                ) : (
                                    <View style={styles.stopSquare} />
                                )}
                            </Pressable>
                        </View>

                        <Text style={styles.timer}>{formatTimer(elapsed)}</Text>
                    </View>
                </Animated.View>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    sheetRoot: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        alignItems: 'stretch',
    },
    inner: {
        flex: 1,
        minHeight: 0,
    },
    titleWrap: {
        alignSelf: 'flex-start',
    },
    title: {
        color: colors.text.primary,
        fontFamily: font.family.black,
        fontSize: font.size.xl,
        letterSpacing: -0.3,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    recDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: colors.accent.primary,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xl,
        paddingVertical: spacing.md,
    },
    ctrlBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.bg.muted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stopBtn: {
        backgroundColor: colors.black,
    },
    ctrlIcon: {
        fontSize: 22,
        color: colors.text.primary,
        fontFamily: font.family.bold,
    },
    stopSquare: {
        width: 22,
        height: 22,
        borderRadius: 4,
        backgroundColor: colors.white,
    },
    timer: {
        textAlign: 'center',
        fontFamily: font.family.medium,
        fontSize: font.size.md,
        color: colors.text.secondary,
    },
})
