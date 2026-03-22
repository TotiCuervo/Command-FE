import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
} as const

// iOS simulator → localhost works. Android emulator → 10.0.2.2
const BASE_URL = Platform.select({
    android: 'http://10.0.2.2/api',
    default: 'http://localhost/api',
})

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
})

client.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN)
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

export default client
