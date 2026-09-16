import { apiClient } from '@/shared/api/client'
import { toApiError, unwrapApiData } from '@/shared/api/unwrap'
import {
  isMockAuthEnabled,
  mockLogin,
  mockRegister,
  mockResendVerification,
  mockVerifyEmail,
} from '@/features/auth/mocks/authMock'
import type { LoginResult } from '@/features/auth/types/auth'

export type { LoginResult } from '@/features/auth/types/auth'

export async function login(
  eventId: string,
  email: string,
  password: string,
): Promise<LoginResult> {
  if (isMockAuthEnabled()) {
    return mockLogin(eventId, email, password)
  }
  try {
    return unwrapApiData(
      await apiClient.post('/auth/login', {
        event_id: eventId,
        email,
        password,
      }),
    )
  } catch (e) {
    // axios は非2xxで AxiosError を throw する。呼び出し側が error.code で
    // 分岐できるよう、封筒から ApiError に変換する（verifyEmail と同じ扱い）
    throw toApiError(e)
  }
}

export async function register(
  eventId: string,
  email: string,
  password: string,
  displayName: string,
): Promise<LoginResult> {
  if (isMockAuthEnabled()) {
    return mockRegister(eventId, email, password, displayName)
  }
  try {
    return unwrapApiData(
      await apiClient.post('/auth/register', {
        event_id: eventId,
        email,
        password,
        display_name: displayName,
      }),
    )
  } catch (e) {
    // 409 CONFLICT（登録済みメール）を呼び出し側で判定するため ApiError に揃える
    throw toApiError(e)
  }
}

/** GET /auth/verify-email?token= を呼ぶ。失敗は ApiError（code: TOKEN_INVALID | TOKEN_EXPIRED 等） */
export async function verifyEmail(token: string): Promise<{ verified: boolean }> {
  if (isMockAuthEnabled()) return mockVerifyEmail(token)
  try {
    return unwrapApiData(await apiClient.get('/auth/verify-email', { params: { token } }))
  } catch (e) {
    // axios は非2xxで AxiosError を throw し unwrapApiData に届かないため、封筒から ApiError に変換する
    throw toApiError(e)
  }
}

/** POST /auth/resend-verification（Bearer は apiClient が自動付与）。409 ALREADY_VERIFIED あり */
export async function resendVerification(): Promise<{ sent: boolean }> {
  if (isMockAuthEnabled()) return mockResendVerification()
  try {
    return unwrapApiData(await apiClient.post('/auth/resend-verification'))
  } catch (e) {
    throw toApiError(e)
  }
}
