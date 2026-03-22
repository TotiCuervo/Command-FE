import client from './client'
import type { AuthResponse, LoginData, RegisterData, User } from '@/types/auth.types'

export const authApi = {
    register: (data: RegisterData) =>
        client.post<AuthResponse>('/auth/register', data).then((r) => r.data),

    login: (data: LoginData) =>
        client.post<AuthResponse>('/auth/login', data).then((r) => r.data),

    logout: () =>
        client.post('/auth/logout'),

    me: () =>
        client.get<{ user: User }>('/auth/me').then((r) => r.data.user),
}
