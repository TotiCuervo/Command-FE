import {
    View,
    Text,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native'
import { Link } from 'expo-router'
import { useState } from 'react'
import { PressableScale } from 'pressto'
import * as Haptics from 'expo-haptics'
import { useAuth } from '@/contexts/AuthContext'
import { colors, font, spacing, radius } from '@/constants/theme'

type FieldErrors = Record<string, string>

export default function RegisterScreen() {
    const { register } = useAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
    const [generalError, setGeneralError] = useState('')

    const clearFieldError = (field: string) =>
        setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next })

    const handleRegister = async () => {
        if (!name || !email || !password) return
        setFieldErrors({})
        setGeneralError('')
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        setIsLoading(true)
        try {
            await register({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
                passwordConfirmation: password,
            })
        } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            const data = err?.response?.data
            if (data?.errors) {
                // Field-level errors from the API — take the first message per field
                const mapped: FieldErrors = {}
                for (const [field, messages] of Object.entries(data.errors)) {
                    mapped[field] = (messages as string[])[0]
                }
                setFieldErrors(mapped)
            } else {
                setGeneralError(data?.message ?? 'Something went wrong. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.inner}>
                <View style={styles.header}>
                    <Text style={styles.wordmark} testID="register__wordmark">Command</Text>
                    <Text style={styles.tagline}>Create your account</Text>
                </View>

                <View style={styles.form}>
                    {/* Name */}
                    <View style={styles.fieldWrap}>
                        <TextInput
                            style={[styles.input, fieldErrors.name && styles.inputError]}
                            placeholder="Full name"
                            placeholderTextColor={colors.text.placeholder}
                            autoCapitalize="words"
                            autoComplete="name"
                            value={name}
                            onChangeText={(v) => { setName(v); clearFieldError('name') }}
                            testID="register__name"
                        />
                        {fieldErrors.name && (
                            <Text style={styles.errorText} testID="register__name-error">
                                {fieldErrors.name}
                            </Text>
                        )}
                    </View>

                    {/* Email */}
                    <View style={styles.fieldWrap}>
                        <TextInput
                            style={[styles.input, fieldErrors.email && styles.inputError]}
                            placeholder="Email"
                            placeholderTextColor={colors.text.placeholder}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            value={email}
                            onChangeText={(v) => { setEmail(v); clearFieldError('email') }}
                            testID="register__email"
                        />
                        {fieldErrors.email && (
                            <Text style={styles.errorText} testID="register__email-error">
                                {fieldErrors.email}
                            </Text>
                        )}
                    </View>

                    {/* Password */}
                    <View style={styles.fieldWrap}>
                        <TextInput
                            style={[styles.input, fieldErrors.password && styles.inputError]}
                            placeholder="Password"
                            placeholderTextColor={colors.text.placeholder}
                            secureTextEntry
                            autoComplete="new-password"
                            value={password}
                            onChangeText={(v) => { setPassword(v); clearFieldError('password') }}
                            testID="register__password"
                        />
                        {fieldErrors.password && (
                            <Text style={styles.errorText} testID="register__password-error">
                                {fieldErrors.password}
                            </Text>
                        )}
                    </View>

                    {/* General error (non-field) */}
                    {generalError ? (
                        <Text style={styles.generalError} testID="register__general-error">
                            {generalError}
                        </Text>
                    ) : null}

                    <PressableScale
                        style={styles.cta}
                        onPress={handleRegister}
                        disabled={isLoading}
                        testID="register__submit"
                    >
                        {isLoading
                            ? <ActivityIndicator color={colors.white} />
                            : <Text style={styles.ctaText}>Create Account</Text>
                        }
                    </PressableScale>
                </View>

                <Link href="/(auth)/login" style={styles.switchLink} testID="register__login-link">
                    <Text style={styles.switchText}>
                        Already have an account?{' '}
                        <Text style={styles.switchTextBold}>Sign In</Text>
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
    fieldWrap: {
        gap: spacing.xs,
    },
    input: {
        height: 52,
        backgroundColor: colors.bg.card,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.lg,
        fontFamily: font.family.regular,
        fontSize: font.size.md,
        color: colors.text.primary,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputError: {
        borderColor: colors.accent.primary,
        backgroundColor: colors.accent.primaryBg,
    },
    errorText: {
        fontFamily: font.family.regular,
        fontSize: font.size.xs,
        color: colors.accent.dark,
        paddingHorizontal: spacing.xs,
    },
    generalError: {
        fontFamily: font.family.regular,
        fontSize: font.size.sm,
        color: colors.accent.dark,
        textAlign: 'center',
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
