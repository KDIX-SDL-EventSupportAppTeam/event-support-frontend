import { useEffect, useRef } from 'react'
import { connectSocket, disconnectSocket } from '@/shared/api/socket'
import { useAuthStore } from '@/shared/auth/authStore'
import { resolveEventDataSourceMode } from '@/shared/data/createEventDataSource'

/**
 * socket.io の `bingo:unlocked`（副経路）を購読する。
 * 仕様: docs/specs/bingo-dynamic-unlock/02-unlock-animation.md
 *
 * 正の経路はチェックインレスポンスの `unlocked_positions`。socket は取りこぼし対策として、
 * カード画面を開いている間に解放を検知するためのもの。ペイロードに `pair_key` が無いため、
 * 演出の重複再生判定には使わない。届いたらカードを再取得し、`unlock_events` から
 * 未再生の演出をキューに積み直す（呼び出し側の責務）。
 */
export function useBingoUnlockedSocket(onUnlocked: () => void): void {
  const token = useAuthStore((s) => s.token)
  // ハンドラの同一性でエフェクトを再実行しない（毎レンダーの再接続を防ぐ）
  const handlerRef = useRef(onUnlocked)
  handlerRef.current = onUnlocked

  useEffect(() => {
    if (!token) return
    if (resolveEventDataSourceMode() !== 'api') return

    const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
    const socket = connectSocket(token, apiBase)
    const handler = () => handlerRef.current()
    socket.on('bingo:unlocked', handler)
    return () => {
      socket.off('bingo:unlocked', handler)
      disconnectSocket()
    }
  }, [token])
}
