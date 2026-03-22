import { View, StyleSheet } from 'react-native'
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated'
import { useEffect } from 'react'

import { colors } from '@/constants/theme'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MinimalVizProps {
    isActive: boolean
    compact?: boolean
    testID?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MinimalViz({ isActive, compact = false, testID }: MinimalVizProps) {
    const pulseScale = useSharedValue(1)
    const pulseOpacity = useSharedValue(0.4)

    useEffect(() => {
        if (isActive) {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.8, { duration: 1200, easing: Easing.out(Easing.quad) }),
                    withTiming(1, { duration: 1200, easing: Easing.in(Easing.quad) })
                ),
                -1,
                true
            )
            pulseOpacity.value = withRepeat(
                withSequence(
                    withTiming(0, { duration: 1200, easing: Easing.out(Easing.quad) }),
                    withTiming(0.4, { duration: 1200, easing: Easing.in(Easing.quad) })
                ),
                -1,
                true
            )
        } else {
            pulseScale.value = withTiming(1, { duration: 300 })
            pulseOpacity.value = withTiming(0.4, { duration: 300 })
        }
    }, [isActive, pulseScale, pulseOpacity])

    const dotSize = compact ? 16 : 32
    const pulseSize = compact ? 40 : 80

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: pulseOpacity.value,
    }))

    return (
        <View style={styles.container} testID={testID}>
            <Animated.View
                style={[
                    styles.pulse,
                    {
                        width: pulseSize,
                        height: pulseSize,
                        borderRadius: pulseSize / 2,
                    },
                    pulseStyle,
                ]}
            />
            <View
                style={[
                    styles.dot,
                    {
                        width: dotSize,
                        height: dotSize,
                        borderRadius: dotSize / 2,
                    },
                ]}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulse: {
        position: 'absolute',
        backgroundColor: colors.accent.primary,
    },
    dot: {
        backgroundColor: colors.accent.primary,
    },
})
