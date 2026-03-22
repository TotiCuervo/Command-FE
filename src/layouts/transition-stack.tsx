import { withLayoutContext } from 'expo-router'
import {
    createNativeStackNavigator,
    type NativeStackNavigationOptions,
    type NativeStackNavigationEventMap,
} from 'react-native-screen-transitions/native-stack'

import type { ParamListBase, StackNavigationState } from '@react-navigation/native'

const { Navigator } = createNativeStackNavigator()

export const TransitionStack = withLayoutContext<
    NativeStackNavigationOptions,
    typeof Navigator,
    StackNavigationState<ParamListBase>,
    NativeStackNavigationEventMap
>(Navigator)
