export interface User {
    id: number
    name: string
    email: string
    createdAt: string
    updatedAt: string
}

export interface AuthResponse {
    user: User
    token: string
}

export interface LoginData {
    email: string
    password: string
}

export interface RegisterData {
    name: string
    email: string
    password: string
    passwordConfirmation: string
}
