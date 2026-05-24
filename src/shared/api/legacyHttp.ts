import axios from 'axios'

/**
 * 旧 Flask（`/api/*`）。設計書の `/api/v1` とは別クライアント。
 * 開発時は Vite の `/api` プロキシでバックエンドへ転送する想定。
 */
export const legacyApi = axios.create({
  baseURL: import.meta.env.VITE_LEGACY_API_BASE_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
})
