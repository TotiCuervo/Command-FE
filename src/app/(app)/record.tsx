import { Dimensions, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useDerivedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useScreenAnimation } from 'react-native-screen-transitions'

import { colors, font, spacing } from '@/constants/theme'

/** Must match `snapPoints` in `(app)/_layout.tsx` (small → full). */
const SNAP_SMALL = 0.3
const SNAP_FULL = 1

const CARD_INSET = 16
/** Rounded corners at the small snap; interpolates to 0 when expanded (softer than the previous 48). */
const CARD_RADIUS = 24

const iosContinuousCorners =
    Platform.OS === 'ios' ? ({ borderCurve: 'continuous' } as const) : null

function useEffectiveWindowHeight(): number {
    const { height } = useWindowDimensions()
    return Math.max(1, height || Dimensions.get('window').height)
}

export default function RecordingScreen() {
    const insets = useSafeAreaInsets()
    const windowHeight = useEffectiveWindowHeight()
    const animation = useScreenAnimation()

    const snapProgress = useDerivedValue(() => {
        const raw = animation.value.current.progress
        const closing = animation.value.current.closing
        const entering = animation.value.current.entering
        const animating = animation.value.current.animating
        const g = animation.value.current.gesture
        const interactive = g.isDragging > 0.5 || g.isDismissing > 0.5
        if (closing > 0.5 || interactive) return raw
        // Opening / snap springs animate `progress` from 0 → first detent. A floor of SNAP_SMALL while idle
        // skipped that motion and the sheet popped in at full small height.
        if (entering > 0.5 || animating > 0.5) return raw
        return Math.max(raw, SNAP_SMALL)
    })

    /**
     * p ∈ [0, SNAP_SMALL]: full minimized height + bottom float immediately; slide in/out with translateY
     * (one motion — no “grow then settle”). p > SNAP_SMALL: band grows for expand-to-full.
     */
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

    return (
        <View style={styles.sheetRoot}>
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
                        <Text style={styles.label}>Recording</Text>
                    </View>
                </Animated.View>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    sheetRoot: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
        alignItems: 'stretch',
    },
    inner: {
        flex: 1,
        minHeight: 0,
    },
    label: {
        color: colors.text.primary,
        fontFamily: font.family.medium,
        fontSize: font.size.lg,
    },
})
