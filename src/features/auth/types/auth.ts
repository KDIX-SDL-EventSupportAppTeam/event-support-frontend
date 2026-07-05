import type { AuthUser } from '@/shared/auth/types'

export type LoginResult = { token: string; user: AuthUser }
