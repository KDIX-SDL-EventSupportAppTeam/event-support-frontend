import { ApiError } from '@/shared/api/unwrap'
import type { LoginResult } from '@/features/auth/types/auth'
import { DEV_DUMMY_EVENT_ID } from '@/features/auth/config/eventIds'
import { DEV_DUMMY_EMAIL, DEV_DUMMY_PASSWORD } from '@/features/auth/mocks/devDummyCredentials'

/** `npm run dev` では既定で有効。実 API に繋ぐときは `.env` に `VITE_MOCK_API=false`。本番ビルドでは常に無効 */
export function isMockAuthEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_MOCK_API !== 'false'
}

/** ローカルモックログインで発行する固定トークン（`authStore` のセッション復元と一致させる） */
export const MOCK_DEV_JWT = 'mock.jwt.local-dev'

export async function mockLogin(
  eventId: string,
  email: string,
  password: string,
): Promise<LoginResult> {
  await new Promise((r) => setTimeout(r, 120))
  if (
    eventId === DEV_DUMMY_EVENT_ID &&
    email === DEV_DUMMY_EMAIL &&
    password === DEV_DUMMY_PASSWORD
  ) {
    return {
      token: MOCK_DEV_JWT,
      user: {
        id: '00000000-0000-0000-0000-000000000001',
        display_name: 'ローカル（モック）',
        event_id: eventId,
      },
    }
  }
  throw new ApiError(
    'UNAUTHORIZED',
    'モック認証: イベント ID・メール・パスワードは docs/tests/fixtures/dummy-login.md の値にしてください',
  )
}

/** 登録もネットワークなしで成功扱い（ローカル UI のみ確認用） */
export async function mockRegister(
  eventId: string,
  _email: string,
  _password: string,
  displayName: string,
): Promise<LoginResult> {
  await new Promise((r) => setTimeout(r, 80))
  return {
    token: MOCK_DEV_JWT,
    user: {
      id: '00000000-0000-0000-0000-000000000002',
      display_name: displayName || '新規（モック）',
      event_id: eventId,
    },
  }
}
