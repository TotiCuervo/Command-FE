import { memo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import Transition from 'react-native-screen-transitions'

import { colors, font, spacing, radius } from '@/constants/theme'
import { formatDate, formatDuration } from '@/utils/format-recording'

import type { Recording } from '@/types/recording.types'

interface RecordingRowProps {
    item: Recording
    index: number
}

export const RecordingRow = memo(function RecordingRow({ item, index }: RecordingRowProps) {
    const router = useRouter()

    const recordingId = item.localId ?? String(item.id)

    return (
        <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
            <Transition.Pressable
                sharedBoundTag={`recording-title-${recordingId}`}
                style={styles.row}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    router.push(`/(app)/recording/${recordingId}`)
                }}
                testID={`home__row-${recordingId}`}
            >
                <View style={styles.icon}>
                    <Text style={styles.iconText}>🎙</Text>
                </View>

                <View style={styles.content}>
                    <Text style={styles.title} numberOfLines={1}>
                        {item.title ?? 'Untitled Recording'}
                    </Text>
                    <Text style={styles.meta}>
                        {formatDate(item.recordedAt)} · {formatDuration(item.duration)}
                    </Text>
                </View>
            </Transition.Pressable>

            <View style={styles.separator} />
        </Animated.View>
    )
})

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: spacing.md,
    },
    icon: {
        width: 48,
        height: 48,
        borderRadius: radius.pill,
        backgroundColor: colors.bg.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconText: {
        fontSize: 22,
    },
    content: {
        flex: 1,
        gap: 3,
    },
    title: {
        fontFamily: font.family.semiBold,
        fontSize: font.size.lg,
        color: colors.text.primary,
    },
    meta: {
        fontFamily: font.family.regular,
        fontSize: font.size.sm,
        color: colors.text.secondary,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border.default,
        marginLeft: 20 + 48 + spacing.md,
    },
})
