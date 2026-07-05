import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { resolveLoginEventId } from '@/features/auth/config/eventIds'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { isAdminUser, useAuthStore } from '@/features/auth/store/authStore'

export function AdminLoginPage() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // ?event= クエリパラメータからイベント ID を取得（主催者ポータル発行の URL。
  // 存在すればそのイベント宛てにログインし、無ければ既定イベントにフォールバック）
  const queryEventId = searchParams.get('event') ?? ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (token && isAdminUser(user)) return <Navigate to="/admin/menu" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await login(queryEventId || resolveLoginEventId(), email, password)
      const current = useAuthStore.getState().user
      if (isAdminUser(current)) {
        navigate('/admin/menu', { replace: true })
      } else {
        useAuthStore.getState().clearSession()
        alert('運営権限がありません')
      }
    } catch {
      /* useAuth が error をセット */
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card p-4">
            <h1 className="h4 mb-3">運営ログイン</h1>
            {queryEventId && (
              <div className="alert alert-info small mb-3">
                <i className="bi bi-info-circle me-1" />
                イベント: <strong>{queryEventId}</strong>
              </div>
            )}
            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <label className="form-label">メールアドレス</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">パスワード</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error ? <p className="text-danger">{error}</p> : null}
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                ログイン
              </button>
            </form>
            <p className="mt-3 mb-0 text-center">
              <Link to="/login">参加者ログインへ</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
