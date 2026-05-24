import { describe, it, expect } from 'vitest'
import { unwrapApiData, ApiError } from '@/shared/api/unwrap'
import type { ApiResponse } from '@/shared/types/api'

describe('unwrapApiData', () => {
  it('成功レスポンスから data を取り出す', () => {
    const res = { data: { success: true, data: { token: 't', user: { id: '1', display_name: 'a', event_id: 'e' } } } as ApiResponse<{
      token: string
      user: { id: string; display_name: string; event_id: string }
    }> }
    const out = unwrapApiData(res)
    expect(out.token).toBe('t')
    expect(out.user.display_name).toBe('a')
  })

  it('失敗レスポンスで ApiError を投げる', () => {
    const res = {
      data: { success: false, error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
    }
    expect(() => unwrapApiData(res)).toThrow(ApiError)
    try {
      unwrapApiData(res)
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as ApiError).code).toBe('UNAUTHORIZED')
    }
  })
})
