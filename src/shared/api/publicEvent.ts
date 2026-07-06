import axios from 'axios'
import { unwrapApiData } from '@/shared/api/unwrap'
import type { ApiResponse } from '@/shared/types/api'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

/**
 * 公開イベント情報専用の axios インスタンス。
 * 認証不要のため、apiClient の Authorization 付与・401 リダイレクトの
 * インターセプタと干渉しないよう独立させている（未ログインで呼ぶため）。
 */
const publicClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

export type PublicEvent = {
  id: string
  name: string
  date_start: string
  date_end: string
  venue: string | null
}

export async function fetchPublicEvent(eventId: string): Promise<PublicEvent> {
  const res = await publicClient.get<ApiResponse<{ event: PublicEvent }>>(
    `/events/${encodeURIComponent(eventId)}/public`,
  )
  return unwrapApiData(res).event
}
