import type { AuthUser } from '@/features/auth/types/user'

export type LoginResult = { token: string; user: AuthUser }
