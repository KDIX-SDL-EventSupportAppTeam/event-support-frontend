import type { AuthUser } from '@/types/user'

export type LoginResult = { token: string; user: AuthUser }
