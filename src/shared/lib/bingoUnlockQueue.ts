/**
 * 解放演出キューの純粋ロジック。
 * 仕様: docs/specs/bingo-dynamic-unlock/02-unlock-animation.md
 *
 * React に依存しないので、「同じ pair_key の演出が2回出る」「1回目の演出しか出ない」を
 * 単体テストで直接検証できる。状態管理は `useUnlockAnimationQueue` が担う。
 */
import { filterUnplayed } from '@/shared/lib/bingoUnlockFlag'

export type UnlockQueueItem = { pairKey: string; positions: number[] }

/** サーバーが返す解放イベント1件分（`unlocked_pairs[]` / `unlock_events[]` 共通の形）。 */
export type UnlockPairInput = { pair_key: string; released_positions: number[] }

/**
 * 未再生かつキュー未登録の解放イベントだけを末尾に追加した新しいキューを返す。
 *
 * 重複を弾く必要があるのは、同じ解放が複数経路で届くため:
 * - チェックインレスポンスの `unlocked_pairs`（正の経路）
 * - socket `bingo:unlocked` → カード再取得の `unlock_events`（副経路）
 * - 手動評価などでカードが再取得され、useEffect が再実行されたとき
 *
 * 再生済みフラグ（sessionStorage）は演出の完了時にしか立たないため、
 * 「再生中に同じ pair_key がもう一度届く」ケースはキュー内の重複チェックでしか防げない。
 */
export function appendUnlockItems(
  queue: UnlockQueueItem[],
  cardId: string,
  incoming: UnlockPairInput[],
): UnlockQueueItem[] {
  const unplayed = new Set(filterUnplayed(cardId, incoming.map((e) => e.pair_key)))
  const seen = new Set(queue.map((item) => item.pairKey))
  const added: UnlockQueueItem[] = []
  for (const event of incoming) {
    if (!unplayed.has(event.pair_key)) continue
    if (seen.has(event.pair_key)) continue
    if (event.released_positions.length === 0) continue
    seen.add(event.pair_key)
    added.push({ pairKey: event.pair_key, positions: event.released_positions })
  }
  return added.length === 0 ? queue : [...queue, ...added]
}
