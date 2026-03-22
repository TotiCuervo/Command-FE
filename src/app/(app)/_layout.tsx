import { Redirect } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Transition from 'react-native-screen-transitions'

import { TransitionStack } from '@/layouts/transition-stack'
import { useAuth } from '@/contexts/AuthContext'
import { SyncProvider } from '@/contexts/SyncContext'
import { RecordingsProvider } from '@/contexts/RecordingsContext'
import { RecorderProvider } from '@/contexts/RecorderContext'

const queryClient = new QueryClient()

export default function AppLayout() {
    const { user, isLoading } = useAuth()

    if (isLoading) return null
    if (!user) return <Redirect href="/(auth)/login" />

    return (
        <QueryClientProvider client={queryClient}>
            <SyncProvider>
                <RecordingsProvider>
                    <RecorderProvider>
                        <TransitionStack
                            screenOptions={{
                                headerShown: false,
                                enableTransitions: true,
                            }}
                        >
                            {/* Home — default horizontal slide */}
                            <TransitionStack.Screen name="index" />

                            {/* Record — slides up from bottom with snap points */}
                            <TransitionStack.Screen
                                name="record"
                                options={{
                                    ...Transition.Presets.SlideFromBottom({
                                        gestureDirection: 'vertical',
                                    }),
                                    snapPoints: [0.15, 1],
                                    initialSnapIndex: 1,
                                    backdropBehavior: 'collapse',
                                }}
                            />

                            {/* Review — shared element morph from record */}
                            <TransitionStack.Screen
                                name="review"
                                options={{
                                    ...Transition.Presets.SharedAppleMusic({
                                        sharedBoundTag: 'recording-title',
                                    }),
                                }}
                            />

                            {/* Detail — shared element morph from list row */}
                            <TransitionStack.Screen
                                name="recording/[id]"
                                options={({ route }) => {
                                    const id = (route.params as { id?: string })?.id ?? ''
                                    return {
                                        ...Transition.Presets.SharedAppleMusic({
                                            sharedBoundTag: `recording-title-${id}`,
                                        }),
                                    }
                                }}
                            />
                        </TransitionStack>
                    </RecorderProvider>
                </RecordingsProvider>
            </SyncProvider>
        </QueryClientProvider>
    )
}
