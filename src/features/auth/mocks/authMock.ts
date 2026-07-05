import { ApiError } from '@/shared/api/unwrap'
import type { LoginResult } from '@/features/auth/types/auth'
import { DEV_DUMMY_EMAIL, DEV_DUMMY_PASSWORD } from '@/features/auth/mocks/devDummyCredentials'
import { DEV_DUMMY_EVENT_ID, isMockAuthEnabled, MOCK_DEV_JWT } from '@/shared/auth/mockSession'

export { isMockAuthEnabled, MOCK_DEV_JWT }

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
        role: 'participant',
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
      role: 'participant',
    },
  }
}
