import { useEffect, useState } from 'react'
import { fetchAdminBoothSummaries } from '@/shared/api/v1Admin'

/**
 * booth_id → display_code（ブース番号）の対応を1回だけ取る。
 *
 * ダッシュボードと分析 API（`/admin/.../dashboard`, `/admin/.../analytics/booths`）は
 * **`display_code` を返さない。** 一方でブースアイコンは番号で引く
 * （docs/reference/assets.md「booth」）ため、番号だけをブース一覧 API から補う。
 *
 * 失敗しても黙って空の Map を返す。**アイコンは飾りなので、
 * ここで転ばせて集計画面を落とさない。** 番号が引けなければアイコンが出ないだけ。
 *
 * ブース番号は当日ほとんど変わらないため再取得もポーリングもしない。
 */
export function useBoothDisplayCodes(eventId: string | undefined, active = true) {
  const [codes, setCodes] = useState<Map<string, string | null>>(new Map())

  useEffect(() => {
    if (!eventId || !active) return
    let alive = true
    fetchAdminBoothSummaries(eventId, { sort: 'name', order: 'asc' })
      .then((booths) => {
        if (alive) setCodes(new Map(booths.map((b) => [b.id, b.display_code])))
      })
      .catch(() => {
        /* アイコンが出ないだけ。集計の表示は続ける */
      })
    return () => {
      alive = false
    }
  }, [eventId, active])

  return codes
}
