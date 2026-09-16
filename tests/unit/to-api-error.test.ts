import { describe, expect, it } from 'vitest'
import { ApiError, toApiError } from '@/shared/api/unwrap'

/** axios.isAxiosError を満たす AxiosError もどきを作る */
function makeAxiosError(data: unknown): Error {
  return Object.assign(new Error('Request failed'), {
    isAxiosError: true,
    response: { data },
  })
}

describe('toApiError', () => {
  it('封筒 { success:false, error } 付き AxiosError は ApiError に変換される', () => {
    const e = makeAxiosError({
      success: false,
      error: { code: 'TOKEN_INVALID', message: 'この確認リンクは無効です' },
    })
    const converted = toApiError(e)
    expect(converted).toBeInstanceOf(ApiError)
    expect((converted as ApiError).code).toBe('TOKEN_INVALID')
    expect((converted as ApiError).message).toBe('この確認リンクは無効です')
  })

  it('封筒なし（レスポンス body が想定外）の AxiosError はそのまま返す', () => {
    const e = makeAxiosError('Internal Server Error')
    expect(toApiError(e)).toBe(e)
  })

  it('既に ApiError ならそのまま返す', () => {
    const e = new ApiError('TOKEN_EXPIRED', '確認リンクの有効期限が切れています')
    expect(toApiError(e)).toBe(e)
  })
})
