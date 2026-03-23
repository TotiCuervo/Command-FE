import 'react-native-reanimated'

import { Redirect } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { interpolateColor } from 'react-native-reanimated'
import Transition from 'react-native-screen-transitions'

import { TransitionStack } from '@/layouts/transition-stack'
import { useAuth } from '@/contexts/AuthContext'
import { SyncProvider } from '@/contexts/SyncContext'
import { RecordingsProvider } from '@/contexts/RecordingsContext'
import { RecorderProvider } from '@/contexts/RecorderContext'

const queryClient = new QueryClient()

/** Bottom sheet: first snap = 30% height, second = full screen (see library snap points docs). */
const RECORD_SNAP_SMALL = 0.3
const RECORD_SNAP_FULL = 1

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
                            <TransitionStack.Screen
                                name="record"
                                options={{
                                    enableTransitions: true,
                                    gestureEnabled: true,
                                    gestureDirection: 'vertical',
                                    snapPoints: [RECORD_SNAP_SMALL, RECORD_SNAP_FULL],
                                    initialSnapIndex: 0,
                                    backdropBehavior: 'dismiss',
                                    // With `snapPoints`, `progress` is the snap fraction (e.g. 0.3 → 1), not 0→1 “enter”.
                                    // SlideFromBottom-style translateY([0,1,2],[h,0,-h]) would apply ~0.7h shift at the first
                                    // snap and breaks the sheet + makes the home screen look “pushed up”. Dim the backdrop
                                    // from `current.progress`; sheet height/position stays in `record.tsx`.
                                    screenStyleInterpolator: ({ current }) => {
                                        'worklet'
                                        const overlay = interpolateColor(
                                            current.progress,
                                            [0, 1],
                                            ['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)'],
                                        )
                                        return {
                                            overlayStyle: {
                                                backgroundColor: overlay,
                                            },
                                            contentStyle: {
                                                backgroundColor: 'transparent',
                                            },
                                        }
                                    },
                                    transitionSpec: {
                                        open: Transition.Specs.DefaultSpec,
                                        close: Transition.Specs.DefaultSpec,
                                        expand: {
                                            stiffness: 500,
                                            damping: 50,
                                            mass: 1,
                                        },
                                        collapse: {
                                            stiffness: 500,
                                            damping: 50,
                                            mass: 1,
                                        },
                                    },
                                }}
                            />
                        </TransitionStack>
                    </RecorderProvider>
                </RecordingsProvider>
            </SyncProvider>
        </QueryClientProvider>
    )
}
