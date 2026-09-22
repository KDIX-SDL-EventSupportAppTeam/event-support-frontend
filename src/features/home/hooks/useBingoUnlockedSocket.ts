import { useEffect, useRef } from 'react'
import { subscribeSocket } from '@/shared/api/socket'

/**
 * socket.io の `bingo:unlocked`（副経路）を購読する。
 * 仕様: docs/specs/bingo-dynamic-unlock/02-unlock-animation.md
 *
 * 正の経路はチェックインレスポンスの `unlocked_positions`。socket は取りこぼし対策として、
 * カード画面を開いている間に解放を検知するためのもの。ペイロードに `pair_key` が無いため、
 * 演出の重複再生判定には使わない。届いたらカードを再取得し、`unlock_events` から
 * 未再生の演出をキューに積み直す（呼び出し側の責務）。
 *
 * 接続の寿命は `subscribeSocket` 側が管理する。購読を解除しても接続は切らない（#132 D1）。
 */
export function useBingoUnlockedSocket(onUnlocked: () => void): void {
  // ハンドラの同一性でエフェクトを再実行しない（毎レンダーの再購読を防ぐ）
  const handlerRef = useRef(onUnlocked)
  handlerRef.current = onUnlocked

  useEffect(() => {
    const handler = () => handlerRef.current()
    return subscribeSocket('bingo:unlocked', handler)
  }, [])
}
