import { View, Text, StyleSheet, TextInput, StatusBar, RefreshControl } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { FlashList } from '@shopify/flash-list'
import { PressableScale } from 'pressto'
import * as Haptics from 'expo-haptics'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, font, spacing, radius } from '@/constants/theme'
import { useRecordings } from '@/contexts/RecordingsContext'
import { useRecorder } from '@/contexts/RecorderContext'
import { RecordingRow } from '@/components/recordings/RecordingRow'
import { EmptyState } from '@/components/recordings/EmptyState'

export default function HomeScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const [searchQuery, setSearchQuery] = useState('')

    const { recordings, isLoading, refetch } = useRecordings()
    const recorder = useRecorder()

    const ctaScale = useSharedValue(1)
    const ctaStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }))

    const filtered = searchQuery.trim()
        ? recordings.filter((r) =>
              (r.title ?? 'Untitled Recording').toLowerCase().includes(searchQuery.toLowerCase())
          )
        : recordings

    const handleRecord = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        ctaScale.value = withSpring(0.96, {}, () => {
            ctaScale.value = withSpring(1)
        })
        const ok = await recorder.start()
        if (ok) {
            router.push('/(app)/record')
        }
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]} testID="home__screen">
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <Text style={styles.title}>Recordings</Text>
            </View>

            <View style={styles.searchWrap}>
                <TextInput
                    style={styles.search}
                    placeholder="Titles, Transcripts"
                    placeholderTextColor={colors.text.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                    testID="home__search"
                />
            </View>

            <FlashList
                data={filtered}
                keyExtractor={(item) => item.localId ?? String(item.id)}
                renderItem={({ item, index }) => <RecordingRow item={item} index={index} />}

                ListEmptyComponent={isLoading ? null : <EmptyState />}
                refreshControl={
                    <RefreshControl
                        refreshing={false}
                        onRefresh={refetch}
                        tintColor={colors.accent.primary}
                    />
                }
                contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
                showsVerticalScrollIndicator={false}
                testID="home__list"
            />

            <Animated.View
                style={[styles.ctaWrap, { paddingBottom: insets.bottom + spacing.lg }, ctaStyle]}
            >
                <PressableScale
                    style={styles.cta}
                    onPress={handleRecord}
                    testID="home__record-btn"
                >
                    <View style={styles.ctaDot} />
                    <Text style={styles.ctaText}>Start Recording</Text>
                </PressableScale>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg.primary,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
    },
    title: {
        fontFamily: font.family.black,
        fontSize: font.size.display,
        color: colors.text.primary,
        letterSpacing: -0.5,
    },
    searchWrap: {
        paddingHorizontal: 20,
        paddingBottom: spacing.md,
    },
    search: {
        height: 44,
        backgroundColor: colors.bg.muted,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.lg,
        fontFamily: font.family.regular,
        fontSize: font.size.md,
        color: colors.text.primary,
    },
    ctaWrap: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: spacing.md,
        backgroundColor: colors.bg.primary,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border.subtle,
    },
    cta: {
        height: 58,
        backgroundColor: colors.black,
        borderRadius: radius.pill,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    ctaDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.accent.primary,
    },
    ctaText: {
        fontFamily: font.family.semiBold,
        fontSize: font.size.lg,
        color: colors.white,
    },
})
