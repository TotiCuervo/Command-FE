import { useWindowDimensions } from 'react-native'
import { Canvas, RoundedRect } from '@shopify/react-native-skia'

import { colors } from '@/constants/theme'

// ─── Constants ────────────────────────────────────────────────────────────────

const BAR_WIDTH = 3
const BAR_GAP = 3
const BAR_MIN_HEIGHT = 4
const BAR_MAX_HEIGHT = 56

// ─── Types ────────────────────────────────────────────────────────────────────

interface WaveformVizProps {
    amplitudes: number[]
    compact?: boolean
    testID?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WaveformViz({ amplitudes, compact = false, testID }: WaveformVizProps) {
    const { width } = useWindowDimensions()
    const horizontalPadding = 40

    const maxHeight = compact ? 24 : BAR_MAX_HEIGHT
    const canvasWidth = width - horizontalPadding
    const canvasHeight = maxHeight + 16

    return (
        <Canvas style={{ width: canvasWidth, height: canvasHeight }} testID={testID}>
            {amplitudes.map((amp, i) => {
                const barH = Math.max(BAR_MIN_HEIGHT, amp * maxHeight)
                const x = i * (BAR_WIDTH + BAR_GAP)
                const y = (canvasHeight - barH) / 2
                return (
                    <RoundedRect
                        key={i}
                        x={x}
                        y={y}
                        width={BAR_WIDTH}
                        height={barH}
                        r={BAR_WIDTH / 2}
                        color={colors.accent.primary}
                        opacity={0.4 + amp * 0.6}
                    />
                )
            })}
        </Canvas>
    )
}
