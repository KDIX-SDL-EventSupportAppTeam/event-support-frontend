import { ApiError } from '@/shared/api/unwrap'

/** server の zod `manual_code: string().min(1).max(6)` は trim 前に掛かる（checkins.ts:20, 99）ため、前後の空白だけはフロントで落とす */
export const MANUAL_CODE_MAX_LENGTH = 6

/**
 * 入力値を送信用に整える。前後の空白を除くだけで、大文字小文字は触らない（照合はサーバー: checkins.ts:99-101）。
 * 送れない値（空・上限超え）は null。
 */
export function toManualCodeForSubmit(raw: string): string | null {
  const code = raw.trim()
  if (code.length === 0 || code.length > MANUAL_CODE_MAX_LENGTH) return null
  return code
}

export const MANUAL_CODE_NOT_FOUND_MSG = 'コードが違います。ブースに掲示されたコードをもう一度確認してください。'

/** 手動コード送信の失敗を、画面の分岐と文言に変換する（純関数。CONFLICT は呼び出し側で already_visited へ） */
export function manualCheckInErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof ApiError && e.code === 'NOT_FOUND') return MANUAL_CODE_NOT_FOUND_MSG
  if (e instanceof ApiError && e.code === 'VALIDATION_ERROR') return 'コードは6文字以内の英数字で入力してください。'
  if (e instanceof ApiError) return e.message
  return fallback
}
