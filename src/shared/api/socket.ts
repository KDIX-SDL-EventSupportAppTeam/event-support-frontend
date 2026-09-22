import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/shared/auth/authStore'
import { resolveEventDataSourceMode } from '@/shared/data/createEventDataSource'

type Handler = (...args: unknown[]) => void

let socket: Socket | null = null
let connectedToken: string | null = null
const handlers = new Map<string, Set<Handler>>()

function resolveSocketBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/api\/v1\/?$/, '')
}

/** 登録済みの全ハンドラを、渡されたソケットに付け直す（D3） */
function attachAllHandlers(target: Socket): void {
  for (const [event, eventHandlers] of handlers.entries()) {
    for (const handler of eventHandlers) {
      target.on(event, handler)
    }
  }
}

function connect(token: string): Socket {
  socket?.disconnect()
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
  const created = io(resolveSocketBaseUrl(apiBase), {
    auth: { token },
    transports: ['websocket', 'polling'],
  })
  attachAllHandlers(created)
  socket = created
  connectedToken = token
  return created
}

/**
 * イベントを購読する。未接続なら接続する（サンプルモードでは接続しない）。
 * 戻り値を呼ぶと購読を解除する。**接続は切らない**（D1）。
 * ログインしている間、購読の有無に関わらず接続を1本だけ保持する。
 */
export function subscribeSocket(event: string, handler: Handler): () => void {
  if (!handlers.has(event)) handlers.set(event, new Set())
  handlers.get(event)!.add(handler)
  socket?.on(event, handler)

  if (!socket) {
    const token = useAuthStore.getState().token
    if (token && resolveEventDataSourceMode() === 'api') {
      connect(token)
    }
  }

  return () => {
    handlers.get(event)?.delete(handler)
    socket?.off(event, handler)
  }
}

/**
 * 認証状態の変化に追従させる。アプリ起動時に1回だけ呼ぶ。
 * ログアウトとトークンの変更のときだけ切断する（D2）。
 */
export function bindSocketToAuth(): void {
  useAuthStore.subscribe((state) => {
    const token = state.token
    if (token === connectedToken) return

    if (!token) {
      socket?.disconnect()
      socket = null
      connectedToken = null
      return
    }

    // トークンの変更: 旧ソケットを切り、購読中のハンドラがあれば新トークンで張り直す（D3）
    socket?.disconnect()
    socket = null
    connectedToken = null
    if (handlers.size > 0 && resolveEventDataSourceMode() === 'api') {
      connect(token)
    }
  })
}

/** テスト用。モジュール状態を初期化する */
export function __resetSocketForTest(): void {
  socket?.disconnect()
  socket = null
  connectedToken = null
  handlers.clear()
}
