import { isMockAuthEnabled } from '@/features/auth/mocks/authMock'

/** `server` の db:seed と同一（docs/tests/fixtures/dummy-login.md） */
export const SEED_DEV_EVENT_ID = '20000000-0000-4000-8000-000000000001'

/** モック認証専用の短い ID（Fastify では不可） */
export const DEV_DUMMY_EVENT_ID = '0000'

/**
 * ログイン API に渡す event_id。
 * - モック: `0000`（または `VITE_DEV_EVENT_ID`）
 * - 実 API: シード UUID（または `VITE_DEV_EVENT_ID`）
 */
export function resolveLoginEventId(): string {
  const fromEnv = import.meta.env.VITE_DEV_EVENT_ID?.trim()
  if (fromEnv) return fromEnv
  return isMockAuthEnabled() ? DEV_DUMMY_EVENT_ID : SEED_DEV_EVENT_ID
}
