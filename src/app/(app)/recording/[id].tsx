import { useEffect, useMemo } from 'react'
import { InteractionManager, Pressable, StyleSheet, Text, View } from 'react-native'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Transition from 'react-native-screen-transitions'

import { colors, font, spacing } from '@/constants/theme'
import { useRecordings } from '@/contexts/RecordingsContext'
import { formatDate, formatDuration } from '@/utils/format-recording'

export default function RecordingDetailScreen() {
    const router = useRouter()
    const navigation = useNavigation()
    const insets = useSafeAreaInsets()
    const { id: rawId, fromRecorder: rawFromRecorder } = useLocalSearchParams<{
        id: string | string[]
        fromRecorder?: string | string[]
    }>()
    const id = Array.isArray(rawId) ? rawId[0] : rawId
    const fromRecorder = Array.isArray(rawFromRecorder) ? rawFromRecorder[0] : rawFromRecorder

    const { recordings } = useRecordings()

    // Stop flow pushes on top of `record` so the sheet doesn’t run its close animation. Once the shared
    // transition has finished, drop `record` from the stack so Back returns home (not an empty sheet).
    useEffect(() => {
        if (fromRecorder !== '1' || !id) return
        const handle = InteractionManager.runAfterInteractions(() => {
            const state = navigation.getState()
            const routes = state?.routes ?? []
            if (!routes.some((r) => r.name === 'record')) return
            navigation.dispatch(
                CommonActions.reset({
                    index: 1,
                    routes: [{ name: 'index' }, { name: 'recording/[id]', params: { id } }],
                }),
            )
        })
        return () => handle.cancel?.()
    }, [fromRecorder, id, navigation])

    const item = useMemo(
        () =>
            recordings.find((r) => r.localId === id || String(r.id) === id) ?? null,
        [recordings, id],
    )

    const title = item?.title ?? 'Untitled Recording'
    const sharedTag = id ? (`recording-title-${id}` as const) : null

    return (
        <View style={[styles.screen, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={12}
                    style={styles.backBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                >
                    <Text style={styles.backChevron}>‹</Text>
                </Pressable>

                {sharedTag ? (
                    <Transition.View sharedBoundTag={sharedTag} style={styles.titleWrap}>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {title}
                        </Text>
                    </Transition.View>
                ) : (
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {title}
                    </Text>
                )}

                <View style={styles.headerActions}>
                    <View style={styles.headerDot} />
                    <View style={styles.headerDot} />
                </View>
            </View>

            {!item ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>Recording not found.</Text>
                </View>
            ) : (
                <>
                    <View style={styles.waveform}>
                        {[0.45, 0.72, 0.55, 0.8].map((w, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.waveBar,
                                    {
                                        width: `${Math.round(w * 100)}%`,
                                    },
                                ]}
                            />
                        ))}
                    </View>

                    <View style={styles.meta}>
                        <Text style={styles.metaText}>
                            {formatDate(item.recordedAt)} · {formatDuration(item.duration)}
                        </Text>
                    </View>
                </>
            )}
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
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
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
    titleWrap: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
    },
    headerTitle: {
        fontFamily: font.family.semiBold,
        fontSize: font.size.lg,
        color: colors.text.primary,
    },
    headerActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        alignItems: 'center',
    },
    headerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border.default,
    },
    waveform: {
        flex: 1,
        justifyContent: 'center',
        gap: spacing.lg,
        paddingHorizontal: spacing.xl,
    },
    waveBar: {
        alignSelf: 'center',
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border.default,
    },
    meta: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxl,
    },
    metaText: {
        fontFamily: font.family.regular,
        fontSize: font.size.sm,
        color: colors.text.secondary,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontFamily: font.family.medium,
        fontSize: font.size.md,
        color: colors.text.secondary,
    },
})
