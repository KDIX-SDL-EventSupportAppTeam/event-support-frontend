import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAppAccess, type AppAccess } from '@/shared/api/appAccess'

/** ポーリング間隔（P-9）。WebSocket は使わない（未ログイン〜ログイン直後の画面でも動く必要があるため） */
const POLL_INTERVAL_MS = 30_000
/** 残り時間表示を1秒ごとに追随させるためのローカル再計算間隔 */
const TICK_INTERVAL_MS = 1_000

export type UseAppAccessResult = {
  access: AppAccess | null
  loading: boolean
  error: unknown
  /**
   * 実効開放状態。**サーバーが返す `access.is_open` だけ**を見る（正本は1つ）。
   * 端末側で `app_opens_at` を跨いで判定を先取りしない。
   * かつては補正済みの「今」で `computeIsOpen` を再計算していたが、その外挿は
   * 往復レイテンシ・端末時計のずれのぶんサーバーより先行し、入口 `/e/:eventId` と
   * `/home` の間で往復リダイレクトを起こしていた（issue #80）。開放後は30秒ポーリングの
   * 次の応答で `access.is_open` が true になり、再読込なしで先へ進む。
   */
  isOpen: boolean
  /** 開放までの残りミリ秒。開放済み・対象外（`closed`）なら null。表示専用 */
  remainingMs: number | null
}

/**
 * サーバー時刻補正後の「今」から `isOpen` / `remainingMs` を導出する純粋関数。
 * hook 本体から分離しているのはテスト容易性のため（React レンダリングなしで検証できる）。
 *
 * `isOpen` はサーバーの `access.is_open` をそのまま返す（フロントで開放判定を再計算しない。
 * `AGENTS.md` 原則3 / issue #80）。`correctedNowMs` は残り時間表示の算出にのみ使う。
 */
export function deriveAppAccessState(
  access: AppAccess,
  correctedNowMs: number,
): { isOpen: boolean; remainingMs: number | null } {
  const isOpen = access.is_open
  const remainingMs =
    !isOpen && access.mode === 'scheduled' && access.app_opens_at
      ? Math.max(0, new Date(access.app_opens_at).getTime() - correctedNowMs)
      : null
  return { isOpen, remainingMs }
}

/**
 * アプリ公開ゲートの状態を30秒間隔でポーリングし、`server_time` との差分で
 * 端末時計のずれを補正した残り時間を返す（P-4 / P-9）。
 */
export function useAppAccess(eventId: string | undefined): UseAppAccessResult {
  const [access, setAccess] = useState<AppAccess | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [, forceTick] = useState(0)
  /** server_time(ms) - 送受信の中点の端末時刻(ms)。以後この差分を端末時計に足して「補正済みの今」を得る */
  const offsetMsRef = useRef(0)

  const poll = useCallback(async (id: string) => {
    try {
      const localBeforeMs = Date.now()
      const data = await fetchAppAccess(id)
      // 送信直前ではなく送受信の中点との差でオフセットを取る。往復レイテンシの
      // 丸ごとぶんではなく半分だけが誤差に残る（残り時間表示のずれを縮める）。
      const localMidMs = (localBeforeMs + Date.now()) / 2
      offsetMsRef.current = new Date(data.server_time).getTime() - localMidMs
      setAccess(data)
      setError(null)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }
    setLoading(true)
    void poll(eventId)
    const pollId = setInterval(() => void poll(eventId), POLL_INTERVAL_MS)
    const tickId = setInterval(() => forceTick((t) => t + 1), TICK_INTERVAL_MS)
    return () => {
      clearInterval(pollId)
      clearInterval(tickId)
    }
  }, [eventId, poll])

  if (!access) {
    return { access: null, loading, error, isOpen: false, remainingMs: null }
  }

  const correctedNowMs = Date.now() + offsetMsRef.current
  const { isOpen, remainingMs } = deriveAppAccessState(access, correctedNowMs)

  return { access, loading, error, isOpen, remainingMs }
}
