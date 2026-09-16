import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

/**
 * 認証不要の公開エンドポイント専用の axios インスタンス。
 *
 * `apiClient`（shared/api/client.ts）は Authorization 付与・401 リダイレクトの
 * インターセプタを持つため、未ログイン〜ログイン直前の画面から呼ぶ公開 API は
 * 干渉を避けてこちらを使う（`/events/:id/public`・`/events/:id/app-access`・
 * `/events/:id/pre-survey/questions` など）。
 */
export const publicClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})
