import type { ParamListBase, StackNavigationState } from '@react-navigation/native'
import { Extrapolation, interpolate } from 'react-native-reanimated'
import { Redirect, withLayoutContext } from 'expo-router'
import {
    createBlankStackNavigator,
    type BlankStackNavigationEventMap,
    type BlankStackNavigationOptions,
} from 'react-native-screen-transitions/blank-stack'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useAuth } from '@/contexts/AuthContext'
import { SyncProvider } from '@/contexts/SyncContext'
import { RecordingsProvider } from '@/contexts/RecordingsContext'

/** Must match `sharedBoundTag` on home + record `Transition.View`s. */
const HEADER_SHARED_BOUND_ID = 'header'

/**
 * Cross-fade (README “Simple Fade”) + shared `header` bounds.
 * @see https://github.com/eds2002/react-native-screen-transitions
 */
const indexRecordScreenOptions: BlankStackNavigationOptions = {
    gestureEnabled: false,
    transitionSpec: {
        open: { stiffness: 1000, damping: 500, mass: 3 },
        close: { stiffness: 1000, damping: 500, mass: 3 },
    },
    screenStyleInterpolator: ({ progress, bounds, focused, current, next }) => {
        'worklet'

        const headerBounds = bounds({
            id: HEADER_SHARED_BOUND_ID,
            method: 'transform',
            scaleMode: 'uniform',
        })

        let headerOpacity = 1
        if (!focused && next) {
            headerOpacity = interpolate(next.progress, [0, 1], [1, 0], Extrapolation.CLAMP)
        } else if (focused) {
            headerOpacity = interpolate(current.closing, [0, 0.22, 1], [1, 0, 0], Extrapolation.CLAMP)
        }

        return {
            contentStyle: {
                opacity: interpolate(progress, [0, 1, 2], [0, 1, 0], Extrapolation.CLAMP),
            },
            [HEADER_SHARED_BOUND_ID]: { ...headerBounds, opacity: headerOpacity },
        }
    },
}

const queryClient = new QueryClient()

const { Navigator } = createBlankStackNavigator()

export const Stack = withLayoutContext<
    BlankStackNavigationOptions,
    typeof Navigator,
    StackNavigationState<ParamListBase>,
    BlankStackNavigationEventMap
>(Navigator)

export default function AppLayout() {
    const { user, isLoading } = useAuth()

    if (isLoading) return null
    if (!user) return <Redirect href="/(auth)/login" />

    return (
        <QueryClientProvider client={queryClient}>
            <SyncProvider>
                <RecordingsProvider>
                    <Stack>
                        <Stack.Screen name="index" options={indexRecordScreenOptions} />
                        <Stack.Screen name="record" options={indexRecordScreenOptions} />
                        <Stack.Screen
                            name="recording/[id]"
                            options={indexRecordScreenOptions}
                        />
                    </Stack>
                </RecordingsProvider>
            </SyncProvider>
        </QueryClientProvider>
    )
}
