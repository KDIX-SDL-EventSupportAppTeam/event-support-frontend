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
   * server_time との差分で補正した「今」から算出した実効開放状態。
   * ポーリング間隔（30秒）より短い周期で残り時間表示を追随させるための、
   * 直近のサーバー応答をそのまま延長した値（P-4 の判定式をそのまま流用。新しい判定はしない）。
   * サーバーからの最新応答が届けば `access.is_open` 側で即座に上書きされる。
   */
  isOpen: boolean
  /** 開放までの残りミリ秒。開放済み・対象外（`closed`）なら null */
  remainingMs: number | null
}

/** P-4 の実効開放状態の判定式（`01-concept.md`）をそのまま使う。ローカル延長表示専用。 */
function computeIsOpen(access: AppAccess, correctedNowMs: number): boolean {
  if (access.mode === 'open') return true
  if (access.mode === 'closed') return false
  if (!access.app_opens_at) return false
  return correctedNowMs >= new Date(access.app_opens_at).getTime()
}

/**
 * サーバー時刻補正後の「今」から `isOpen` / `remainingMs` を導出する純粋関数。
 * hook 本体から分離しているのはテスト容易性のため（React レンダリングなしで検証できる）。
 */
export function deriveAppAccessState(
  access: AppAccess,
  correctedNowMs: number,
): { isOpen: boolean; remainingMs: number | null } {
  const isOpen = access.is_open || computeIsOpen(access, correctedNowMs)
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
  /** server_time(ms) - 取得直前の端末時刻(ms)。以後この差分を端末時計に足して「補正済みの今」を得る */
  const offsetMsRef = useRef(0)

  const poll = useCallback(async (id: string) => {
    try {
      const localBeforeMs = Date.now()
      const data = await fetchAppAccess(id)
      offsetMsRef.current = new Date(data.server_time).getTime() - localBeforeMs
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
