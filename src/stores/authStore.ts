import { create } from 'zustand'
import { DEV_DUMMY_EVENT_ID } from '@/config/eventIds'
import { isMockAuthEnabled, MOCK_DEV_JWT } from '@/mocks/authMock'
import type { AuthUser } from '@/types/user'

const TOKEN_KEY = 'token'
const USER_KEY = 'auth_user'

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
    try {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch {
      /* ignore */
    }
    set({ token, user, isAuthenticated: true })
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
