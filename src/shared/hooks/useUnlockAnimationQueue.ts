import { useCallback, useState } from 'react'
import { markUnlockAnimationPlayed } from '@/shared/lib/bingoUnlockFlag'
import { appendUnlockItems, type UnlockPairInput, type UnlockQueueItem } from '@/shared/lib/bingoUnlockQueue'

/**
 * 解放演出のキュー管理。
 * 仕様: docs/specs/bingo-dynamic-unlock/02-unlock-animation.md
 *
 * `pair_key` ごとに独立して再生済みを判定するため、複数の解放イベントが同時に
 * （中央3マス目・4マス目の達成では2〜3ペアが同時成立する）届いても、
 * 未再生のものだけを1つずつ順番に見せられる。
 *
 * 積み直しの重複はキュー内の `pair_key` で弾く（再生済みフラグは演出完了時にしか立たないため、
 * 再生中に同じ解放が別経路で届くケースはフラグでは防げない）。
 */
export function useUnlockAnimationQueue() {
  const [queue, setQueue] = useState<UnlockQueueItem[]>([])

  /**
   * サーバーが返した解放イベント（チェックインレスポンスの `unlocked_pairs` /
   * カード取得の `unlock_events`）から、未再生のものをまとめてキューに積む。
   */
  const enqueuePairs = useCallback((cardId: string, pairs: UnlockPairInput[]) => {
    // サーバー側の unlocked_pairs 追加は並行作業中。未対応のサーバーに繋いだときに
    // undefined で落ちないようにだけしておく（演出が出ないだけで済ませる）
    if (!pairs || pairs.length === 0) return
    setQueue((q) => appendUnlockItems(q, cardId, pairs))
  }, [])

  const current = queue[0] ?? null

  const advance = useCallback((cardId: string) => {
    // 先頭要素は setQueue の更新関数の中で読む。`current` を閉じ込めると、
    // 直前に別経路でキューが変化していたときに誤った pair_key を再生済みにしてしまう。
    setQueue((q) => {
      const head = q[0]
      if (head) markUnlockAnimationPlayed(cardId, head.pairKey)
      return q.slice(1)
    })
  }, [])

  return { current, enqueuePairs, advance }
}
