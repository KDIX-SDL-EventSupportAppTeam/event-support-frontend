import { useEffect, useState } from 'react'
import { connectSocket, disconnectSocket } from '@/shared/api/socket'
import { formatClientError } from '@/shared/lib/formatClientError'

/** socket イベントによる再取得の最小間隔（ミリ秒）。
 *  チェックイン多発時に重い分析クエリを叩き続けないようスロットルする。 */
const REFETCH_THROTTLE_MS = 3000

type UseAnalyticsDataOptions = {
  /** 定期ポーリング間隔（ミリ秒）。未指定ならポーリングしない */
  pollMs?: number
  /** これらの socket イベント受信でスロットル付き再取得する（例: ['checkin:new']） */
  refetchEvents?: readonly string[]
  /** socket 接続に使う JWT。refetchEvents を使う場合は必須 */
  token?: string | null
}

/**
 * 分析ウィンドウ用のデータ取得フック。
 * - active になった時に1回取得
 * - `pollMs` 指定時は定期ポーリング（安全網）
 * - `refetchEvents` + `token` 指定時は WebSocket イベントでスロットル付き再取得（ほぼリアルタイム）
 *
 * パフォーマンス: active なウィンドウのみ動作し、socket 再取得は
 * 最大 REFETCH_THROTTLE_MS に1回までに制限する。
 */
export function useAnalyticsData<T>(
  active: boolean,
  eventId: string,
  fetcher: (id: string) => Promise<T>,
  errorFallback: string,
  options: UseAnalyticsDataOptions = {},
) {
  const { pollMs, refetchEvents, token } = options
  // 配列は毎レンダー新しい参照になり deps を不安定にするため、文字列化して比較する
  const eventsKey = refetchEvents?.join(',') ?? ''

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!active) return
    let cancelled = false

    const reload = () => {
      fetcher(eventId)
        .then((result) => {
          if (!cancelled) setData(result)
        })
        .catch((e) => {
          if (!cancelled) setError(formatClientError(e, errorFallback))
        })
    }

    reload()

    // (1) 定期ポーリング（安全網）
    const pollTimer = pollMs && pollMs > 0 ? setInterval(reload, pollMs) : undefined

    // (2) WebSocket イベントでのスロットル付き再取得
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
    const events = eventsKey ? eventsKey.split(',') : []
    let socket: ReturnType<typeof connectSocket> | undefined
    let lastRun = 0
    let pending: ReturnType<typeof setTimeout> | undefined
    const onEvent = () => {
      const since = Date.now() - lastRun
      if (since >= REFETCH_THROTTLE_MS) {
        lastRun = Date.now()
        reload()
      } else if (!pending) {
        // クールダウン中に来たイベントは末尾で1回だけまとめて反映
        pending = setTimeout(() => {
          pending = undefined
          lastRun = Date.now()
          reload()
        }, REFETCH_THROTTLE_MS - since)
      }
    }
    if (token && events.length > 0) {
      socket = connectSocket(token, apiBase)
      for (const ev of events) socket.on(ev, onEvent)
    }

    return () => {
      cancelled = true
      if (pollTimer) clearInterval(pollTimer)
      if (pending) clearTimeout(pending)
      if (socket) {
        for (const ev of events) socket.off(ev, onEvent)
        disconnectSocket()
      }
    }
  }, [active, eventId, fetcher, errorFallback, pollMs, eventsKey, token])

  return { data, error }
}
