import { useCallback, useEffect, useState } from 'react'
import { createEventDataSource } from '@/shared/data/createEventDataSource'
import { formatClientError } from '@/shared/lib/formatClientError'
import type { LegacyBooth } from '@/shared/types/legacyBooth'

export function useLegacyBoothList(eventId: string | undefined, userId: string | undefined) {
  const [booths, setBooths] = useState<LegacyBooth[]>([])
  const [checkedInBoothIds, setCheckedInBoothIds] = useState<string[]>([])
  // 初期値は true。false にすると、effect が走る前の1フレームだけ
  // 「読み込み済みで0件」に見え、呼び出し側が通信エラーの表示を出してしまう
  // （/checkin?booth_id= で入ったときに実際に起きた）
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!eventId || !userId) {
      setBooths([])
      setCheckedInBoothIds([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const ds = createEventDataSource()
      const [b, c] = await Promise.all([
        ds.getLegacyBooths(eventId),
        ds.getCheckedInBoothIds(eventId, userId),
      ])
      setBooths(b)
      setCheckedInBoothIds(c)
    } catch (e) {
      const message = formatClientError(e, 'データの取得に失敗しました')
      setError(message)
      setBooths([])
      setCheckedInBoothIds([])
    } finally {
      setLoading(false)
    }
  }, [eventId, userId])

  useEffect(() => {
    void load()
  }, [load])

  return { booths, checkedInBoothIds, loading, error, reload: load }
}
