import { useCallback, useEffect, useState } from 'react'
import { fetchV1BingoCard } from '@/shared/api/v1Participant'
import { resolveEventDataSourceMode } from '@/shared/data/createEventDataSource'
import { buildSampleBingoCard } from '@/shared/data/sample/sampleBingoCard'
import { formatClientError } from '@/shared/lib/formatClientError'
import type { BingoCard } from '@/shared/types/bingoCard'

/**
 * 動的段階解放ビンゴカードのデータ取得。
 * サーバーを単一の真実源とする（仕様: docs/specs/bingo-dynamic-unlock/01-card-display.md）。
 * 進捗・ライン数の再計算はしない。`card.progress` / `card.lines_completed` をそのまま使う。
 */
export function useHomeBingoData(eventId: string | undefined, userId: string | undefined) {
  const [card, setCard] = useState<BingoCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!eventId || !userId) {
      setCard(null)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const c =
        resolveEventDataSourceMode() === 'sample'
          ? buildSampleBingoCard(eventId, userId)
          : await fetchV1BingoCard(eventId)
      setCard(c)
    } catch (e) {
      setCard(null)
      setError(formatClientError(e, 'ビンゴ情報の取得に失敗しました'))
    } finally {
      setLoading(false)
    }
  }, [eventId, userId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await refetch()
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
  }, [refetch])

  return { card, loading, error, refetch }
}
