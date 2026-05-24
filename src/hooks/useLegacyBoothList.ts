import { useCallback, useEffect, useState } from 'react'
import { createEventDataSource } from '@/data/createEventDataSource'
import { formatClientError } from '@/lib/formatClientError'
import type { LegacyBooth } from '@/types/legacyBooth'

export function useLegacyBoothList(eventId: string | undefined, userId: string | undefined) {
  const [booths, setBooths] = useState<LegacyBooth[]>([])
  const [checkedInIds, setCheckedInIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!eventId || !userId) {
      setBooths([])
      setCheckedInIds([])
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
      setCheckedInIds(c)
    } catch (e) {
      const message = formatClientError(e, 'データの取得に失敗しました')
      setError(message)
      setBooths([])
      setCheckedInIds([])
    } finally {
      setLoading(false)
    }
  }, [eventId, userId])

  useEffect(() => {
    void load()
  }, [load])

  return { booths, checkedInIds, loading, error, reload: load }
}
