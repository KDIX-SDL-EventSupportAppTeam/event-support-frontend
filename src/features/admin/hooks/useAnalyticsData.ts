import { useEffect, useState } from 'react'
import { formatClientError } from '@/shared/lib/formatClientError'

export function useAnalyticsData<T>(
  active: boolean,
  eventId: string,
  fetcher: (id: string) => Promise<T>,
  errorFallback: string,
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!active) return
    let cancelled = false
    fetcher(eventId)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((e) => {
        if (!cancelled) setError(formatClientError(e, errorFallback))
      })
    return () => {
      cancelled = true
    }
  }, [active, eventId, fetcher, errorFallback])

  return { data, error }
}
