import { publicClient } from '@/shared/api/publicClient'
import { unwrapApiData } from '@/shared/api/unwrap'
import type { ApiResponse } from '@/shared/types/api'
import type { AppAccessMode } from '@/shared/api/appAccess'

export type PublicEvent = {
  id: string
  name: string
  date_start: string
  date_end: string
  venue: string | null
  survey_url: string | null
  /** アプリ公開ゲート。完了画面以外で「今アプリを開けるか」を見る箇所はこれを使う（06-api.md） */
  app_access: {
    is_open: boolean
    mode: AppAccessMode
    app_opens_at: string | null
    pre_survey_closes_at: string | null
  }
}

/**
 * サーバーは `app_access` を `event` の中ではなく **兄弟**として返す
 * （`data: { event: {...}, app_access: {...} }`）。呼び出し側が扱いやすいよう
 * ここで 1 つの `PublicEvent` に畳んでから返す。
 */
type PublicEventResponse = {
  event: Omit<PublicEvent, 'app_access'>
  app_access?: PublicEvent['app_access']
}

/**
 * `app_access` が欠けている場合は「開いている」とみなす。
 * ゲート取得に失敗したときに利用者を締め出さない（RequireAppOpen の catch と同じ方針）。
 */
const FALLBACK_APP_ACCESS: PublicEvent['app_access'] = {
  is_open: true,
  mode: 'open',
  app_opens_at: null,
  pre_survey_closes_at: null,
}

export async function fetchPublicEvent(eventId: string): Promise<PublicEvent> {
  const res = await publicClient.get<ApiResponse<PublicEventResponse>>(
    `/events/${encodeURIComponent(eventId)}/public`,
  )
  const data = unwrapApiData(res)
  return { ...data.event, app_access: data.app_access ?? FALLBACK_APP_ACCESS }
}
