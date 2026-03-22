import { Stack, Redirect } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthLayout() {
    const { user, isLoading } = useAuth()

    if (isLoading) return null
    if (user) return <Redirect href="/(app)" />

    return <Stack screenOptions={{ headerShown: false }} />
}
