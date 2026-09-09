import { apiClient } from '@/shared/api/client'
import { ApiError, toApiError, unwrapApiData } from '@/shared/api/unwrap'
import { isMockAuthEnabled } from '@/features/auth/mocks/authMock'

/**
 * パスワード再設定 API（issue #107 / server #125）。
 *
 * - 申請は **event_id が要る**（`users` は UNIQUE (email, event_id)。email だけでは特定できない）
 * - 申請の応答は登録の有無にかかわらず同じ（アカウント列挙対策）。呼び出し側で成否を出し分けない
 * - 再設定は無効・期限切れトークンで **410 `TOKEN_EXPIRED`**
 */

const SAME_MESSAGE = 'メールアドレスが登録されている場合、再設定用のリンクを送信しました'

/** POST /auth/forgot-password。常に成功扱い（存在を漏らさない）。 */
export async function requestPasswordReset(eventId: string, email: string): Promise<{ message: string }> {
  if (isMockAuthEnabled()) {
    await new Promise((r) => setTimeout(r, 150))
    return { message: SAME_MESSAGE }
  }
  try {
    return unwrapApiData(
      await apiClient.post('/auth/forgot-password', { event_id: eventId, email }),
    )
  } catch (e) {
    throw toApiError(e)
  }
}

/** POST /auth/reset-password。失敗は ApiError（code: TOKEN_EXPIRED | VALIDATION_ERROR 等）。 */
export async function resetPassword(token: string, password: string): Promise<{ reset: boolean }> {
  if (isMockAuthEnabled()) {
    await new Promise((r) => setTimeout(r, 150))
    // ローカル確認用: token が "expired" のときだけ 410 相当を返す
    if (token === 'expired') {
      throw new ApiError('TOKEN_EXPIRED', 'この再設定リンクは無効です。もう一度お手続きください')
    }
    return { reset: true }
  }
  try {
    return unwrapApiData(await apiClient.post('/auth/reset-password', { token, password }))
  } catch (e) {
    throw toApiError(e)
  }
}
