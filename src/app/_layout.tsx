import { Stack } from 'expo-router'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'

import { AuthProvider } from '@/contexts/AuthContext'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        'Geist-Regular': require('../../assets/fonts/Geist-Regular.ttf'),
        'Geist-Medium': require('../../assets/fonts/Geist-Medium.ttf'),
        'Geist-SemiBold': require('../../assets/fonts/Geist-SemiBold.ttf'),
        'Geist-Bold': require('../../assets/fonts/Geist-Bold.ttf'),
        'Geist-Black': require('../../assets/fonts/Geist-Black.ttf'),
    })

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync()
        }
    }, [fontsLoaded])

    if (!fontsLoaded) return null

    return (
        <AuthProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
    )
}
