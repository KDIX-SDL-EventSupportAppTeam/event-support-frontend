import { FormEvent, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { resolveLoginEventId } from '@/features/auth/config/eventIds'
import { resolveDevLoginEmail, resolveDevLoginPassword } from '@/features/auth/mocks/devDummyCredentials'
import { useAuthStore } from '@/shared/auth/authStore'

export function LoginPage() {
  const token = useAuthStore((s) => s.token)
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(() => (import.meta.env.DEV ? resolveDevLoginEmail() : ''))
  const [password, setPassword] = useState(() =>
    import.meta.env.DEV ? resolveDevLoginPassword() : '',
  )
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  useEffect(() => {
    if (token) navigate('/home', { replace: true })
  }, [token, navigate])

  if (token) return <Navigate to="/home" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await login(resolveLoginEventId(), email, password)
      navigate('/home', { replace: true })
    } catch {
      /* useAuth が error をセット */
    }
  }

  return (
    <div>
      {loading ? (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center"
          style={{ background: 'rgba(0,0,0,0.55)', zIndex: 2000 }}
        >
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-light">ログインしています...</p>
        </div>
      ) : null}

      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6">
            <div className="card p-4">
              <div className="card-body">
                <h1 className="card-title text-center mb-4">ログイン</h1>
                <form onSubmit={onSubmit}>
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
                      パスワード
                    </label>
                    <div className="input-group">
                      <input
                        id="password"
                        type={isPasswordVisible ? 'text' : 'password'}
                        className="form-control"
                        value={password}
                        onChange={(ev) => setPassword(ev.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setIsPasswordVisible((v) => !v)}
                        aria-label="パスワード表示切替"
                      >
                        <i className={`bi ${isPasswordVisible ? 'bi-eye-slash' : 'bi-eye'}`} />
                      </button>
                    </div>
                  </div>
                  {error ? <p className="text-danger text-center">{error}</p> : null}
                  <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                      ログイン
                    </button>
                  </div>
                </form>
                <div className="text-center mt-4">
                  <p className="mb-1">
                    <Link to="/register">新規登録はこちら</Link>
                  </p>
                  <p className="mb-0">
                    <Link to="/forgot-password">パスワードをお忘れですか？</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
