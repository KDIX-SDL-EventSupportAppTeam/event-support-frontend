import { publicClient } from '@/shared/api/publicClient'
import { unwrapApiData } from '@/shared/api/unwrap'
import type { ApiResponse } from '@/shared/types/api'

/**
 * アプリ公開ゲート（`event_app_access`）。
 * API 契約の正本: event-support-server `docs/specs/pre-survey/06-api.md`
 * （`GET /events/:event_id/app-access`、公開・認証なし）。
 */
export type AppAccessMode = 'closed' | 'scheduled' | 'open'

export type AppAccess = {
  event_id: string
  /** 実効開放状態。サーバーが唯一の判定者（フロントでは再計算しない） */
  is_open: boolean
  mode: AppAccessMode
  app_opens_at: string | null
  pre_survey_closes_at: string | null
  is_pre_survey_open: boolean
  /** サーバー現在時刻（ISO8601）。端末時計のずれ補正に使う（P-4） */
  server_time: string
}

export async function fetchAppAccess(eventId: string): Promise<AppAccess> {
  const res = await publicClient.get<ApiResponse<AppAccess>>(
    `/events/${encodeURIComponent(eventId)}/app-access`,
  )
  return unwrapApiData(res)
}
