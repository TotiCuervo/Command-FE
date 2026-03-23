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
const CARD_RADIUS = 48

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
        const g = animation.value.current.gesture
        const interactive = g.isDragging > 0.5 || g.isDismissing > 0.5
        if (closing > 0.5 || interactive) return raw
        return Math.max(raw, SNAP_SMALL)
    })

    /**
     * Outer shell height = full snap band `p × windowHeight` (never subtract margin from height).
     * Bottom float is `paddingBottom` so the inner card always receives the remaining space; subtracting
     * margin from height produced 0 when `p` was small or `marginBottom` clamped large.
     */
    const shellStyle = useAnimatedStyle(() => {
        const p = snapProgress.value
        const band = p * windowHeight
        const inset = interpolate(p, [SNAP_SMALL, SNAP_FULL], [CARD_INSET, 0], Extrapolation.CLAMP)
        const paddingBottom = interpolate(
            p,
            [SNAP_SMALL, SNAP_FULL],
            [CARD_INSET + insets.bottom, 0],
            Extrapolation.CLAMP,
        )
        return {
            height: Math.max(0, band),
            paddingHorizontal: inset,
            paddingBottom,
            paddingTop: 0,
            backgroundColor: 'transparent',
            alignSelf: 'stretch',
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
                                paddingBottom: spacing.lg,
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
