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

/** 設計ドキュメント `docs/designs/api.md` の共通レスポンス形式に従う */
export function unwrapApiData<T>(axiosResponse: { data: ApiResponse<T> }): T {
  const body = axiosResponse.data
  if (!body.success) {
    throw new ApiError(body.error.code, body.error.message)
  }
  return body.data
}
