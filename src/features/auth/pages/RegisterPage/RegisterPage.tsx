import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { resolveLoginEventId } from '@/features/auth/config/eventIds'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  DEV_API_DISPLAY_NAME,
  resolveDevLoginEmail,
  resolveDevLoginPassword,
} from '@/features/auth/mocks/devDummyCredentials'
import { useAuthStore } from '@/shared/auth/authStore'

export function RegisterPage() {
  const token = useAuthStore((s) => s.token)
  const { register, loading, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(() => (import.meta.env.DEV ? resolveDevLoginEmail() : ''))
  const [password, setPassword] = useState(() =>
    import.meta.env.DEV ? resolveDevLoginPassword() : '',
  )
  const [displayName, setDisplayName] = useState(() =>
    import.meta.env.DEV ? import.meta.env.VITE_DEV_DISPLAY_NAME?.trim() || DEV_API_DISPLAY_NAME : '',
  )

  if (token) return <Navigate to="/home" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await register(resolveLoginEventId(), email, password, displayName)
      navigate('/home', { replace: true })
    } catch {
      /* useAuth が error をセット */
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6">
          <div className="card p-4">
            <div className="card-body">
              <h1 className="card-title text-center mb-4">新規登録</h1>
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label htmlFor="displayName" className="form-label">
                    表示名
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    className="form-control"
                    value={displayName}
                    onChange={(ev) => setDisplayName(ev.target.value)}
                    required
                    maxLength={200}
                    autoComplete="name"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    メールアドレス
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    パスワード（8文字以上）
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                {error ? <p className="text-danger text-center">{error}</p> : null}
                <div className="d-grid mt-4">
                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? '登録中…' : '登録する'}
                  </button>
                </div>
              </form>
              <p className="text-center mt-4 mb-0">
                <Link to="/login">ログインはこちら</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
