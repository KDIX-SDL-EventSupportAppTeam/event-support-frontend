import { describe, it, expect } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'
import { ApiError } from '@/shared/api/unwrap'
import { formatClientError } from '@/shared/lib/formatClientError'

function mockAxiosError(status: number, data: unknown): AxiosError {
  const response = { status, data, statusText: '', headers: {}, config: {} } as AxiosResponse
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, response)
}

describe('formatClientError', () => {
  it('ApiError の message をそのまま返す', () => {
    const err = new ApiError('UNAUTHORIZED', 'メールアドレスまたはパスワードが正しくありません')
    expect(formatClientError(err, '失敗', 'login')).toBe('メールアドレスまたはパスワードが正しくありません')
  })

  it('axios 401 でも API の error.message を優先する', () => {
    const err = mockAxiosError(401, {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'メールアドレスまたはパスワードが正しくありません' },
    })
    expect(formatClientError(err, 'ログインに失敗しました', 'login')).toBe(
      'メールアドレスまたはパスワードが正しくありません',
    )
  })

  it('login 文脈で API メッセージがない 401 は資格情報エラー', () => {
    const err = mockAxiosError(401, {})
    expect(formatClientError(err, 'ログインに失敗しました', 'login')).toBe(
      'メールアドレスまたはパスワードが正しくありません',
    )
  })

  it('session 文脈の 401 は再ログインを促す', () => {
    const err = mockAxiosError(401, {
      success: false,
      error: { code: 'UNAUTHORIZED', message: '認証に失敗しました' },
    })
    expect(formatClientError(err, '取得に失敗しました')).toBe('認証に失敗しました')
  })

  it('403 は API メッセージを優先する', () => {
    const err = mockAxiosError(403, {
      success: false,
      error: { code: 'FORBIDDEN', message: '運営権限が必要です' },
    })
    expect(formatClientError(err, '失敗')).toBe('運営権限が必要です')
  })
})
