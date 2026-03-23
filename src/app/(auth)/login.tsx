import {
    View,
    Text,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    StatusBar,
} from 'react-native'
import { Link } from 'expo-router'
import { useState } from 'react'
import { PressableScale } from 'pressto'
import * as Haptics from 'expo-haptics'
import { useAuth } from '@/contexts/AuthContext'
import { colors, font, spacing, radius } from '@/constants/theme'

export default function LoginScreen() {
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async () => {
        if (!email || !password) return
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        setIsLoading(true)
        try {
            await login({ email: email.trim().toLowerCase(), password })
        } catch {
            Alert.alert('Sign in failed', 'Check your email and password and try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="dark-content" />
            <View style={styles.inner}>
                <View style={styles.header}>
                    <Text style={styles.wordmark} testID="login__wordmark">Command</Text>
                    <Text style={styles.tagline}>Voice → Knowledge → Action</Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={colors.text.placeholder}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        value={email}
                        onChangeText={setEmail}
                        testID="login__email"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={colors.text.placeholder}
                        secureTextEntry
                        autoComplete="current-password"
                        value={password}
                        onChangeText={setPassword}
                        testID="login__password"
                    />

                    <PressableScale
                        style={styles.cta}
                        onPress={handleLogin}
                        disabled={isLoading}
                        testID="login__submit"
                    >
                        {isLoading
                            ? <ActivityIndicator color={colors.white} />
                            : <Text style={styles.ctaText}>Sign In</Text>
                        }
                    </PressableScale>
                </View>

                <Link href="/(auth)/register" style={styles.switchLink} testID="login__register-link">
                    <Text style={styles.switchText}>
                        Don't have an account?{' '}
                        <Text style={styles.switchTextBold}>Register</Text>
                    </Text>
                </Link>
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg.primary,
    },
    inner: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        justifyContent: 'center',
        gap: spacing.xxxl,
    },
    header: {
        alignItems: 'center',
        gap: spacing.sm,
    },
    wordmark: {
        fontFamily: font.family.black,
        fontSize: font.size.hero,
        color: colors.text.primary,
        letterSpacing: -1,
    },
    tagline: {
        fontFamily: font.family.regular,
        fontSize: font.size.sm,
        color: colors.text.secondary,
        letterSpacing: 0.2,
    },
    form: {
        gap: spacing.md,
    },
    input: {
        height: 52,
        backgroundColor: colors.bg.muted,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.lg,
        fontFamily: font.family.regular,
        fontSize: font.size.md,
        color: colors.text.primary,
    },
    cta: {
        height: 56,
        backgroundColor: colors.black,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.sm,
    },
    ctaText: {
        fontFamily: font.family.semiBold,
        fontSize: font.size.lg,
        color: colors.white,
    },
    switchLink: {
        alignSelf: 'center',
    },
    switchText: {
        fontFamily: font.family.regular,
        fontSize: font.size.sm,
        color: colors.text.secondary,
    },
    switchTextBold: {
        fontFamily: font.family.semiBold,
        color: colors.text.primary,
    },
})
