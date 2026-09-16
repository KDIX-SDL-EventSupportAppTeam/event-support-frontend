import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'

const apiPostMock = vi.fn()

vi.mock('@/shared/api/client', () => ({
  apiClient: { post: (...args: unknown[]) => apiPostMock(...args) },
}))

// 実 API 経路を検証する（モック認証が有効だとネットワークまで届かない）
vi.mock('@/features/auth/mocks/authMock', () => ({
  isMockAuthEnabled: () => false,
  mockLogin: vi.fn(),
  mockRegister: vi.fn(),
  mockVerifyEmail: vi.fn(),
  mockResendVerification: vi.fn(),
}))

const { login, register } = await import('@/features/auth/api/auth')
const { ApiError } = await import('@/shared/api/unwrap')

/** サーバーの失敗レスポンス（封筒形式）を持つ AxiosError を作る */
function axiosFailure(status: number, code: string, message: string): AxiosError {
  const error = new AxiosError('Request failed')
  error.response = {
    status,
    statusText: '',
    data: { success: false, error: { code, message } },
    headers: {},
    config: { headers: new AxiosHeaders() },
  }
  return error
}

beforeEach(() => {
  apiPostMock.mockReset()
})

describe('auth API のエラー変換', () => {
  it('登録済みメールの 409 を ApiError(CONFLICT) にする', async () => {
    apiPostMock.mockRejectedValue(
      axiosFailure(409, 'CONFLICT', 'このメールアドレスは既に登録されています'),
    )
    // 呼び出し側（AuthStep）がこの code を見てサインインへ切り替える
    await expect(register('ev', 'a@example.com', 'password', '名前')).rejects.toMatchObject({
      code: 'CONFLICT',
    })
    await expect(register('ev', 'a@example.com', 'password', '名前')).rejects.toBeInstanceOf(
      ApiError,
    )
  })

  it('ログイン失敗の 401 を ApiError(UNAUTHORIZED) にする', async () => {
    apiPostMock.mockRejectedValue(
      axiosFailure(401, 'UNAUTHORIZED', 'メールアドレスまたはパスワードが正しくありません'),
    )
    await expect(login('ev', 'a@example.com', 'bad')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('封筒を持たないネットワークエラーは変換せずそのまま投げる', async () => {
    // 変換すると formatClientError の開発向けヒント（サーバー未起動の案内）が失われる
    const networkError = new AxiosError('Network Error')
    networkError.code = 'ERR_NETWORK'
    apiPostMock.mockRejectedValue(networkError)
    await expect(login('ev', 'a@example.com', 'pw')).rejects.not.toBeInstanceOf(ApiError)
  })
})
