import axios from 'axios'
import { ApiError } from '@/shared/api/unwrap'

/** 401/403 など HTTP ステータスに応じたフォールバックの文脈 */
export type ClientErrorContext = 'login' | 'register' | 'session'

type ApiErrorBody = { code?: string; message?: string }

function extractApiError(data: unknown): ApiErrorBody | null {
  if (!data || typeof data !== 'object' || !('error' in data)) return null
  const err = (data as { error?: ApiErrorBody }).error
  if (!err?.message) return null
  return { code: err.code, message: err.message }
}

function statusFallback(
  status: number,
  context: ClientErrorContext,
  code?: string,
): string | null {
  switch (status) {
    case 401:
      if (context === 'login' || context === 'register') {
        return 'メールアドレスまたはパスワードが正しくありません'
      }
      if (code === 'UNAUTHORIZED') {
        return 'ログインの有効期限が切れました。再度ログインしてください。'
      }
      return '認証が必要です。再度ログインしてください。'
    case 403:
      if (code === 'FORBIDDEN') {
        return context === 'session'
          ? 'この操作を行う権限がありません'
          : 'アクセスが拒否されました'
      }
      return 'アクセスが拒否されました'
    case 404:
      return 'データが見つかりません'
    case 409:
      return '既に登録されているか、競合するデータがあります'
    case 422:
      return '入力内容を確認してください'
    case 500:
      return 'サーバーエラーが発生しました。しばらくしてから再度お試しください'
    default:
      return null
  }
}

/** API 呼び出し失敗を画面向けメッセージに変換する */
export function formatClientError(
  e: unknown,
  fallback: string,
  context: ClientErrorContext = 'session',
): string {
  if (e instanceof ApiError) return e.message

  if (axios.isAxiosError(e)) {
    if (e.code === 'ERR_NETWORK' || e.message.includes('Network Error')) {
      return import.meta.env.DEV
        ? 'API サーバーに接続できません。server/ で npm run dev が起動しているか確認してください。'
        : 'サーバーに接続できません。ネットワークを確認して再度お試しください。'
    }

    const body = e.response?.data
    const bodyText =
      typeof body === 'string'
        ? body
        : body && typeof body === 'object' && 'message' in body
          ? String((body as { message?: unknown }).message ?? '')
          : ''

    if (
      import.meta.env.DEV &&
      bodyText.includes('ECONNREFUSED') &&
      (bodyText.includes(':3306') || bodyText.includes('3306'))
    ) {
      return 'MySQL に接続できません。リポジトリルートで docker compose up -d mysql を実行してください。'
    }
    if (import.meta.env.DEV && e.response?.status === 500 && bodyText.includes('ECONNREFUSED')) {
      return 'API サーバーに接続できません（:3000）。server/ で npm run dev を起動してください。'
    }

    const apiError = extractApiError(body)
    if (apiError?.message) return apiError.message

    const status = e.response?.status
    if (status) {
      const byStatus = statusFallback(status, context, apiError?.code)
      if (byStatus) return byStatus
    }

    if (e.message) return e.message
  }

  if (e instanceof Error && e.message) return e.message
  return fallback
}
