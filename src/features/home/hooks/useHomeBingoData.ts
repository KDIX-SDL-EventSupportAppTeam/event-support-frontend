import { useEffect, useState } from 'react'
import { createEventDataSource, resolveEventDataSourceMode } from '@/shared/data/createEventDataSource'
import { countCompletedBingoLines } from '@/shared/data/sample/bingoRandom'
import { formatClientError } from '@/shared/lib/formatClientError'
import type { BingoGridCell } from '@/shared/types/legacyBooth'

export function useHomeBingoData(eventId: string | undefined, userId: string | undefined) {
  const [grid, setGrid] = useState<BingoGridCell[]>([])
  const [bingoCount, setBingoCount] = useState(0)
  const [gachaponCoinsSpent, setGachaponCoinsSpent] = useState(0)
  const [checkedInIds, setCheckedInIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId || !userId) {
      setGrid([])
      setError(null)
      setLoading(false)
      return
    }
    const ds = createEventDataSource()
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [g, chk, s] = await Promise.all([
          ds.getBingoGrid(eventId, userId),
          ds.getCheckedInBoothIds(eventId, userId),
          ds.getGachaponCoinsSpent(eventId, userId),
        ])
        const c =
          resolveEventDataSourceMode() === 'api'
            ? countCompletedBingoLines(g, new Set(chk))
            : await ds.getBingoCount(eventId, userId)
        if (!cancelled) {
          setGrid(g)
          setBingoCount(c)
          setGachaponCoinsSpent(s)
          setCheckedInIds(chk)
        }
      } catch (e) {
        if (!cancelled) {
          setGrid([])
          setError(formatClientError(e, 'ビンゴ情報の取得に失敗しました'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [eventId, userId])

  return { grid, bingoCount, gachaponCoinsSpent, checkedInIds, loading, error }
}
