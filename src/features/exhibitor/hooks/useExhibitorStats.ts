import { useEffect, useState } from 'react'
import { fetchExhibitorBoothStats, type ExhibitorBoothStats } from '@/shared/api/v1Exhibitor'
import { formatClientError } from '@/shared/lib/formatClientError'

const POLL_MS = 60_000 // CheckinAnalyticsWindow と同じ60秒ポーリング

/**
 * 出展者ダッシュボードの stats 取得＋ポーリングフック。
 * `features/admin/hooks/useAnalyticsData.ts` と同じ構造（active時に1回＋pollMs ポーリング）を
 * boothId 引数対応・socket なしに簡略化して feature 内に持つ（admin フィーチャーからの越境 import をしない）。
 * 仕様: 改修プラン frontend_43_出展者管理画面.md §4-6
 */
export function useExhibitorStats(eventId: string | undefined, boothId: string | null) {
  const [data, setData] = useState<ExhibitorBoothStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setData(null) // ブース切替時は前のブースの数値が残らないようリセット
    setError(null)
    if (!eventId || !boothId) return
    let cancelled = false
    const reload = () => {
      fetchExhibitorBoothStats(eventId, boothId)
        .then((d) => {
          if (!cancelled) {
            setData(d)
            setError(null)
          }
        })
        .catch((e) => {
          if (!cancelled) setError(formatClientError(e, '統計の取得に失敗しました'))
        })
    }
    reload()
    const t = setInterval(reload, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [eventId, boothId])

  return { data, error }
}
