import { create } from 'zustand'
import { isJwtExpired } from '@/shared/auth/authStore'

const ORGANIZER_TOKEN_KEY = 'organizer_auth_token'
const ORGANIZER_USER_KEY = 'organizer_auth_user'

export type OrganizerUser = {
  id: string
  email: string
  display_name: string
}

type OrganizerState = {
  token: string | null
  organizer: OrganizerUser | null
  setSession: (token: string, organizer: OrganizerUser) => void
  clear: () => void
}

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(ORGANIZER_TOKEN_KEY)
  } catch {
    return null
  }
}

function readStoredOrganizer(): OrganizerUser | null {
  try {
    const raw = localStorage.getItem(ORGANIZER_USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as OrganizerUser
  } catch {
    return null
  }
}

/**
 * セッション復元時に主催者トークン（30 日有効）の失効を判定する。
 * 期限切れなら破棄し未ログインで開始する（参加者側 readInitialSession と同方針）。
 */
function readInitialSession(): { token: string | null; organizer: OrganizerUser | null } {
  const token = readStoredToken()
  if (!token || isJwtExpired(token)) {
    if (token) {
      try {
        localStorage.removeItem(ORGANIZER_TOKEN_KEY)
        localStorage.removeItem(ORGANIZER_USER_KEY)
      } catch {
        /* ignore */
      }
    }
    return { token: null, organizer: null }
  }
  return { token, organizer: readStoredOrganizer() }
}

const initial = readInitialSession()
const initialToken = initial.token
const initialOrganizer = initial.organizer

export const useOrganizerStore = create<OrganizerState>((set) => ({
  token: initialToken,
  organizer: initialOrganizer,
  setSession: (token, organizer) => {
    try {
      localStorage.setItem(ORGANIZER_TOKEN_KEY, token)
      localStorage.setItem(ORGANIZER_USER_KEY, JSON.stringify(organizer))
    } catch {
      /* ignore */
    }
    set({ token, organizer })
  },
  clear: () => {
    try {
      localStorage.removeItem(ORGANIZER_TOKEN_KEY)
      localStorage.removeItem(ORGANIZER_USER_KEY)
    } catch {
      /* ignore */
    }
    set({ token: null, organizer: null })
  },
}))

export function isOrganizerLoggedIn(): boolean {
  const { token, organizer } = useOrganizerStore.getState()
  return !!(token && organizer)
}
