import axios from 'axios'
import { ApiError } from '@/api/unwrap'

/** API 呼び出し失敗を画面向けメッセージに変換する */
export function formatClientError(e: unknown, fallback: string): string {
  if (e instanceof ApiError) return e.message
  if (axios.isAxiosError(e)) {
    if (e.code === 'ERR_NETWORK' || e.message.includes('Network Error')) {
      return 'API サーバーに接続できません。server/ で npm run dev が起動しているか確認してください。'
    }
    const body = e.response?.data
    const bodyText =
      typeof body === 'string'
        ? body
        : body && typeof body === 'object' && 'message' in body
          ? String((body as { message?: unknown }).message ?? '')
          : ''
    if (
      bodyText.includes('ECONNREFUSED') &&
      (bodyText.includes(':3306') || bodyText.includes('3306'))
    ) {
      return 'MySQL に接続できません。リポジトリルートで docker compose up -d mysql を実行してください。'
    }
    if (e.response?.status === 500 && bodyText.includes('ECONNREFUSED')) {
      return 'API サーバーに接続できません（:3000）。server/ で npm run dev を起動してください。'
    }
    if (e.response?.status === 401) {
      return '認証の有効期限が切れています。一度ログアウトしてから再ログインしてください。'
    }
    if (e.response?.status === 403) {
      return 'イベント ID が一致しません。ログアウト後、実 API 用に再ログインしてください。'
    }
    const msg = e.response?.data
    if (msg && typeof msg === 'object' && 'error' in msg) {
      const err = (msg as { error?: { message?: string } }).error
      if (err?.message) return err.message
    }
    if (e.message) return e.message
  }
  if (e instanceof Error && e.message) return e.message
  return fallback
}
