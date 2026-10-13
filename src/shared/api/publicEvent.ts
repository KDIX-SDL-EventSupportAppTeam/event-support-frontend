import { publicClient } from '@/shared/api/publicClient'
import { cachedFetch } from '@/shared/api/responseCache'
import { unwrapApiData } from '@/shared/api/unwrap'
import type { ApiResponse } from '@/shared/types/api'

/**
 * イベントの公開情報（名称・会期・会場）。
 *
 * このレスポンスにはサーバー側で `app_access` も同梱されるが、**フロントでは読まない**。
 * 「今アプリを開けるか」は `GET /events/:event_id/app-access`（`shared/api/appAccess`）
 * ただ1つを正本とする。ここにも写しを持つと、同じ判定に2つの口ができて
 * キャッシュ差・レプリカ遅延で食い違い、往復リダイレクトの原因になる（issue #80）。
 */
export type PublicEvent = {
  id: string
  name: string
  date_start: string
  date_end: string
  venue: string | null
  survey_url: string | null
}

/**
 * サーバーは `event` と `app_access` を **兄弟**として返す
 * （`data: { event: {...}, app_access: {...} }`）。`app_access` は上記の理由で捨て、
 * `event` だけを取り出す。
 */
type PublicEventResponse = {
  event: PublicEvent
}

/**
 * eventId ごとにメモリ上でキャッシュする（ページを再読み込みするまで有効）。
 * 同時に呼ばれたときは Promise を共有する。失敗はキャッシュしない。
 */
export function fetchPublicEvent(eventId: string): Promise<PublicEvent> {
  return cachedFetch(publicEventCacheKey(eventId), async () => {
    const res = await publicClient.get<ApiResponse<PublicEventResponse>>(
      `/events/${encodeURIComponent(eventId)}/public`,
    )
    return unwrapApiData(res).event
  })
}

function publicEventCacheKey(eventId: string): string {
  return `public-event:${eventId}`
}
