function isMockAuthEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_MOCK_API !== 'false'
}

/** モック認証用（Zod の email 検証を通らないため実 API では不可） */
export const DEV_DUMMY_EMAIL = 'a@a'
export const DEV_DUMMY_PASSWORD = 'password'

/** 実 API 用（`server` の db:seed が投入。docs/tests/fixtures/dummy-login.md と同期） */
export const DEV_API_EMAIL = 'dev@example.com'
export const DEV_API_PASSWORD = 'password123'
export const DEV_API_DISPLAY_NAME = '開発用参加者'

export { DEV_DUMMY_EVENT_ID, SEED_DEV_EVENT_ID } from '@/config/eventIds'

export function resolveDevLoginEmail(): string {
  const fromEnv = import.meta.env.VITE_DEV_LOGIN_EMAIL?.trim()
  if (fromEnv) return fromEnv
  return isMockAuthEnabled() ? DEV_DUMMY_EMAIL : DEV_API_EMAIL
}

export function resolveDevLoginPassword(): string {
  const fromEnv = import.meta.env.VITE_DEV_LOGIN_PASSWORD?.trim()
  if (fromEnv) return fromEnv
  return isMockAuthEnabled() ? DEV_DUMMY_PASSWORD : DEV_API_PASSWORD
}
