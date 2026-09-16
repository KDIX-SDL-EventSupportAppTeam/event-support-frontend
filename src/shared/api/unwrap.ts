import axios from 'axios'
import type { ApiResponse } from '@/shared/types/api'

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** 設計ドキュメント `event-support-server/docs/legacy/designs/api.md` の共通レスポンス形式に従う */
export function unwrapApiData<T>(axiosResponse: { data: ApiResponse<T> }): T {
  const body = axiosResponse.data
  if (!body.success) {
    throw new ApiError(body.error.code, body.error.message)
  }
  return body.data
}

/**
 * axios の非2xx例外を、封筒 { success:false, error:{code,message} } から ApiError へ変換する。
 * 変換できない例外（ネットワーク断など）はそのまま返す。
 */
export function toApiError(e: unknown): unknown {
  if (e instanceof ApiError) return e
  if (axios.isAxiosError(e)) {
    const body = e.response?.data as ApiResponse<unknown> | undefined
    if (body && typeof body === 'object' && 'success' in body && body.success === false) {
      return new ApiError(body.error.code, body.error.message)
    }
  }
  return e
}
