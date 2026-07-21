import { useCallback, useState } from 'react'
import * as authApi from '@/features/auth/api/auth'
import { ApiError } from '@/shared/api/unwrap'
import { formatClientError } from '@/shared/lib/formatClientError'
import { useAuthStore } from '@/shared/auth/authStore'

export type ResendState = 'idle' | 'sending' | 'sent' | 'already_verified' | 'error'

/**
 * 確認メール再送ボタンの共通ロジック（issue #47 §5-4）。
 * ①送信済み画面と③エラー画面で共用する。
 */
export function useResendVerification() {
  const token = useAuthStore((s) => s.token)
  const canResend = !!token
  const [state, setState] = useState<ResendState>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const resend = useCallback(async () => {
    if (!canResend) return
    setState('sending')
    setMessage(null)
    try {
      await authApi.resendVerification()
      setState('sent')
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ALREADY_VERIFIED') {
        setState('already_verified')
      } else {
        setState('error')
        setMessage(formatClientError(e, '再送に失敗しました'))
      }
    }
  }, [canResend])

  return { canResend, state, message, resend }
}
