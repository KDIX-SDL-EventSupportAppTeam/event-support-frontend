import { useCallback, useEffect, useState } from 'react'
import { createEventDataSource } from '@/shared/data/createEventDataSource'
import type { Award } from '@/shared/types/award'

export function useAwards(eventId: string | undefined) {
  const [awards, setAwards] = useState<Award[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!eventId) {
      setAwards([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await createEventDataSource().getAwards(eventId)
      setAwards(data)
    } catch (e) {
      const message = e instanceof Error ? e.message : '賞一覧の取得に失敗しました'
      setError(message)
      setAwards([])
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void load()
  }, [load])

  return { awards, loading, error, reload: load }
}
