import { useCallback, useEffect, useState } from 'react'
import { createEventDataSource } from '@/shared/data/createEventDataSource'
import { formatClientError } from '@/shared/lib/formatClientError'
import type { LegacyBooth } from '@/shared/types/legacyBooth'

export function useLegacyBoothList(eventId: string | undefined, userId: string | undefined) {
  const [booths, setBooths] = useState<LegacyBooth[]>([])
  const [checkedInBoothIds, setCheckedInBoothIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!eventId || !userId) {
      setBooths([])
      setCheckedInBoothIds([])
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
