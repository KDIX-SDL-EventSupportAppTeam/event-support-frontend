import { useCallback, useState } from 'react'
import * as authApi from '@/api/auth'
import { formatClientError } from '@/lib/formatClientError'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(
    async (eventId: string, email: string, password: string) => {
      setError(null)
      setLoading(true)
      try {
        const data = await authApi.login(eventId, email, password)
        setSession(data.token, data.user)
      } catch (e) {
        setError(formatClientError(e, 'ログインに失敗しました'))
        throw e
      } finally {
        setLoading(false)
      }
    },
    [setSession],
  )

  const register = useCallback(
    async (eventId: string, email: string, password: string, displayName: string) => {
      setError(null)
      setLoading(true)
      try {
        const data = await authApi.register(eventId, email, password, displayName)
        setSession(data.token, data.user)
      } catch (e) {
        setError(formatClientError(e, '登録に失敗しました'))
        throw e
      } finally {
        setLoading(false)
      }
    },
    [setSession],
  )

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  return { login, register, logout, loading, error }
}
