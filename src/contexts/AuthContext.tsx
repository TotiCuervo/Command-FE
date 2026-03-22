import { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { authApi } from '@/api/auth'
import { STORAGE_KEYS } from '@/api/client'
import type { User, LoginData, RegisterData } from '@/types/auth.types'

interface AuthContextValue {
    user: User | null
    token: string | null
    isLoading: boolean
    login: (data: LoginData) => Promise<void>
    register: (data: RegisterData) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const restore = async () => {
            try {
                const stored = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN)
                if (stored) {
                    setToken(stored)
                    const me = await authApi.me()
                    setUser(me)
                }
            } catch {
                await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN)
            } finally {
                setIsLoading(false)
            }
        }

        restore()
    }, [])

    const login = async (data: LoginData) => {
        const res = await authApi.login(data)
        await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, res.token)
        setToken(res.token)
        setUser(res.user)
    }

    const register = async (data: RegisterData) => {
        const res = await authApi.register(data)
        await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, res.token)
        setToken(res.token)
        setUser(res.user)
    }

    const logout = async () => {
        try {
            await authApi.logout()
        } finally {
            await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN)
            setToken(null)
            setUser(null)
        }
    }

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
