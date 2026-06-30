import { FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { organizerLogin } from '@/features/organizer/api/organizerApi'
import { useOrganizerStore } from '@/features/organizer/store/organizerStore'

/**
 * /organizer/login
 * オーガナイザー（主催者）ログインページ。
 * 参加者・スタッフの認証とは独立した別のセッションを持つ。
 */
export function OrganizerLoginPage() {
  const token = useOrganizerStore((s) => s.token)
  const organizer = useOrganizerStore((s) => s.organizer)
  const setSession = useOrganizerStore((s) => s.setSession)
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // すでにログイン済みなら作成ページへ
  if (token && organizer) {
    return <Navigate to="/organizer/events/new" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await organizerLogin({ email, password })
      setSession(res.token, res.organizer)
      navigate('/organizer/events/new', { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message ?? 'ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card p-4">
            <h1 className="h4 mb-3">主催者ログイン</h1>
            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <label className="form-label">メールアドレス</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
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
                  autoComplete="current-password"
                />
              </div>
              {error ? <p className="text-danger">{error}</p> : null}
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? 'ログイン中…' : 'ログイン'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
