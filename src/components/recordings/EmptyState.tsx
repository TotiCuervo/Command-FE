import { View, Text, StyleSheet } from 'react-native'

import { colors, font, spacing } from '@/constants/theme'

export function EmptyState() {
    return (
        <View style={styles.container} testID="home__empty">
            <Text style={styles.title}>No recordings yet</Text>
            <Text style={styles.subtitle}>Tap Start Recording to capture your first thought.</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
        gap: spacing.sm,
    },
    title: {
        fontFamily: font.family.semiBold,
        fontSize: font.size.xl,
        color: colors.text.primary,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: font.family.regular,
        fontSize: font.size.md,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: font.size.md * 1.5,
    },
})
