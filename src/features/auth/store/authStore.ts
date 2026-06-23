import { create } from 'zustand'
import { DEV_DUMMY_EVENT_ID } from '@/features/auth/config/eventIds'
import { isMockAuthEnabled, MOCK_DEV_JWT } from '@/features/auth/mocks/authMock'
import type { AuthUser } from '@/features/auth/types/user'
import { TOKEN_KEY, USER_KEY } from '@/shared/config/storageKeys'

function roleFromToken(token: string): AuthUser['role'] {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { role?: string }
    return payload.role === 'admin' ? 'admin' : 'participant'
  } catch {
    return 'participant'
  }
}

/** JWT の exp を見て期限切れか判定する。壊れたトークンも無効扱い。 */
export function isJwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number }
    if (typeof payload.exp !== 'number') return false // exp が無ければ判定不能（保持）
    return payload.exp * 1000 <= Date.now()
  } catch {
    return true // デコードできない壊れたトークンは無効
  }
}

function normalizeUser(user: AuthUser, token: string): AuthUser {
  return {
    ...user,
    role: user.role ?? roleFromToken(token),
  }
}

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const u = JSON.parse(raw) as unknown
    if (
      u &&
      typeof u === 'object' &&
      'id' in u &&
      'event_id' in u &&
      typeof (u as AuthUser).id === 'string' &&
      typeof (u as AuthUser).event_id === 'string'
    ) {
      return u as AuthUser
    }
  } catch {
    /* ignore */
  }
  return null
}

/** 実 API モードなのにモック用セッションが残っている */
function isStaleSessionForRealApi(token: string, user: AuthUser | null): boolean {
  if (isMockAuthEnabled()) return false
  if (token === MOCK_DEV_JWT) return true
  if (user?.event_id === DEV_DUMMY_EVENT_ID) return true
  return false
}

function clearStoredSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * トークンだけ残っていた古いセッションや、リロード直後の不整合を補正する。
 */
function readInitialSession(): { token: string | null; user: AuthUser | null } {
  const token = readStoredToken()
  let user = readStoredUser()

  if (token && isStaleSessionForRealApi(token, user)) {
    clearStoredSession()
    return { token: null, user: null }
  }

  // 期限切れ・破損トークンは破棄（モックトークンは実 JWT でないため除外）
  if (token && !isMockAuthEnabled() && isJwtExpired(token)) {
    clearStoredSession()
    return { token: null, user: null }
  }

  if (!token) {
    try {
      localStorage.removeItem(USER_KEY)
    } catch {
      /* ignore */
    }
    return { token: null, user: null }
  }

  if (!user) {
    if (import.meta.env.DEV && token === MOCK_DEV_JWT && isMockAuthEnabled()) {
      user = {
        id: '00000000-0000-0000-0000-000000000001',
        display_name: 'ローカル（モック）',
        event_id: DEV_DUMMY_EVENT_ID,
        role: 'participant',
      }
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(user))
      } catch {
        /* ignore */
      }
      return { token, user }
    }
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch {
      /* ignore */
    }
    return { token: null, user: null }
  }

  user = normalizeUser(user, token)
  return { token, user }
}

const initial = readInitialSession()

type AuthState = {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  setSession: (token: string, user: AuthUser) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: initial.token,
  user: initial.user,
  isAuthenticated: !!(initial.token && initial.user),
  setSession: (token, user) => {
    const normalized = normalizeUser(user, token)
    try {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(normalized))
    } catch {
      /* ignore */
    }
    set({ token, user: normalized, isAuthenticated: true })
  },
  clearSession: () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch {
      /* ignore */
    }
    set({ token: null, user: null, isAuthenticated: false })
  },
}))

export function isAdminUser(user: AuthUser | null | undefined): boolean {
  return user?.role === 'admin'
}
