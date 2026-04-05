import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Transition from 'react-native-screen-transitions'

import { colors, font, radius, spacing } from '@/constants/theme'
import { useRecordings } from '@/contexts/RecordingsContext'
import type { Recording } from '@/types/recording.types'

function recordingRouteId(r: Recording): string {
    return r.localId ?? String(r.id)
}

/** Stub screen — UI only, no recording. */
export default function RecordScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const { recordings } = useRecordings()

    const lastRecording = recordings[recordings.length - 1]
    const lastId = lastRecording ? recordingRouteId(lastRecording) : null

    const onOpenLast = () => {
        if (lastId) router.replace(`/(app)/recording/${lastId}`)
    }

    return (
        <View style={[styles.screen, { paddingTop: Math.max(insets.top, spacing.lg) }]}>
            <View style={[styles.topBar, { paddingHorizontal: spacing.lg }]}>
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={12}
                    style={styles.backBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Text style={styles.backChevron}>‹</Text>
                </Pressable>
                <Transition.View sharedBoundTag="header" style={styles.header}>
                    <Text style={styles.headerTitle}>New Recording</Text>
                </Transition.View>
            </View>

            <View style={[styles.body, { paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
                <Pressable
                    onPress={onOpenLast}
                    disabled={!lastId}
                    style={({ pressed }) => [
                        styles.openLastBtn,
                        !lastId && styles.openLastBtnDisabled,
                        pressed && lastId && styles.openLastBtnPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Open last recording in list"
                    accessibilityState={{ disabled: !lastId }}
                >
                    <Text style={[styles.openLastLabel, !lastId && styles.openLastLabelDisabled]}>
                        Open last recording
                    </Text>
                </Pressable>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.bg.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
        flex: 1,
        justifyContent: 'center',
    },
    topBar: {
        flex: 1,
        // backgroundColor: 'red',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingBottom: spacing.sm,
    },
    backBtn: {
        paddingVertical: 4,
        paddingRight: spacing.sm,
    },
    backChevron: {
        fontSize: 32,
        lineHeight: 34,
        color: colors.text.primary,
        fontFamily: font.family.medium,
    },
    headerTitle: {
        fontFamily: font.family.black,
        fontSize: font.size.display,
        color: colors.text.primary,
        letterSpacing: -0.5,
    },
    body: {
        flex: 1,
        justifyContent: 'center',
    },
    openLastBtn: {
        alignSelf: 'stretch',
        height: 52,
        borderRadius: radius.pill,
        backgroundColor: colors.black,
        alignItems: 'center',
        justifyContent: 'center',
    },
    openLastBtnPressed: {
        opacity: 0.88,
    },
    openLastBtnDisabled: {
        backgroundColor: colors.bg.muted,
    },
    openLastLabel: {
        fontFamily: font.family.semiBold,
        fontSize: font.size.md,
        color: colors.white,
    },
    openLastLabelDisabled: {
        color: colors.text.placeholder,
    },
})
