import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Transition from 'react-native-screen-transitions'

import { colors, font, spacing } from '@/constants/theme'

/** Stub screen — UI only. */
export default function RecordingDetailScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()

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
                    <Text style={styles.headerTitle}>Recording Detail</Text>
                </Transition.View>
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
})
