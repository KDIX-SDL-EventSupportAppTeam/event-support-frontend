import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PreSurveyLayout } from '@/features/presurvey/components/PreSurveyLayout'

/**
 * /pre-survey/:eventId/signin
 * 2 回目以降のサインイン。参加者認証は既存の `features/auth`（`POST /auth/login`）をそのまま使う（P-1）。
 */
export function PreSurveySignInPage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { login, loading, error } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await login(eventId, email, password)
      navigate(`/pre-survey/${eventId}/form`, { replace: true })
    } catch {
      // エラー表示は useAuth の error state に任せる
    }
  }

  return (
    <PreSurveyLayout title="サインイン" subtitle="2 回目以降の方はこちらから">
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="presurvey-signin-email" className="form-label">
            メールアドレス
          </label>
          <input
            id="presurvey-signin-email"
            type="email"
            className="form-control"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="presurvey-signin-password" className="form-label">
            パスワード
          </label>
          <input
            id="presurvey-signin-password"
            type="password"
            className="form-control"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error ? <p className="text-danger text-center">{error}</p> : null}
        <div className="d-grid mt-4">
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? '確認中…' : 'サインイン'}
          </button>
        </div>
      </form>
      <p className="text-center mt-4 mb-0">
        <Link to={`/pre-survey/${eventId}/signup`}>はじめての方はこちら</Link>
      </p>
    </PreSurveyLayout>
  )
}
