import { useEffect } from 'react'
import { getSocket } from '@/shared/api/socket'

export type BingoUnlockedPayload = { card_id: string; unlocked_at: string }

/**
 * socket.io の `bingo:unlocked`（副経路）を購読する。
 * 正の経路はチェックインレスポンスの `unlocked: true`（`CheckInPage`）であり、
 * これは取りこぼし対策として、カード画面を開いている間に解放を検知するためのもの。
 * 仕様: docs/.sdd/05-state-api/types-and-client.md「socket.io」
 */
export function useBingoUnlockedSocket(onUnlocked: (payload: BingoUnlockedPayload) => void): void {
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handler = (data: BingoUnlockedPayload) => onUnlocked(data)
    socket.on('bingo:unlocked', handler)
    return () => {
      socket.off('bingo:unlocked', handler)
    }
  }, [onUnlocked])
}
