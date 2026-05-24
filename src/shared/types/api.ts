/**
 * 共通レスポンスエンベロープ。
 * ユビキタス言語: docs/ubiquitous-language.md の「API レスポンス共通構造」
 */
export type ApiSuccess<T> = { success: true; data: T }
export type ApiFailure = {
  success: false
  error: { code: string; message: string }
}
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

/**
 * 既知の API エラーコード（ユビキタス言語に登録済み）。
 * 未知のコードは `string` として扱う（後方互換のため）。
 */
export type ApiErrorCode = 'UNAUTHORIZED' | 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION_ERROR'

export function isApiErrorCode(code: string): code is ApiErrorCode {
  return (
    code === 'UNAUTHORIZED' ||
    code === 'NOT_FOUND' ||
    code === 'CONFLICT' ||
    code === 'VALIDATION_ERROR'
  )
}
