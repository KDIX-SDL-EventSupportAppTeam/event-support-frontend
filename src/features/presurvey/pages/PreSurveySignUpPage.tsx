import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PreSurveyLayout } from '@/features/presurvey/components/PreSurveyLayout'

/**
 * /pre-survey/:eventId/signup
 * 初回のサインアップ。参加者認証は既存の `features/auth`（`POST /auth/register`）をそのまま使う（P-1）。
 * 成功したら回答入力画面へ進む。
 */
export function PreSurveySignUpPage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { register, loading, error } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await register(eventId, email, password, displayName)
      navigate(`/pre-survey/${eventId}/form`, { replace: true })
    } catch {
      // エラー表示は useAuth の error state に任せる
    }
  }

  return (
    <PreSurveyLayout title="サインアップ" subtitle="事前アンケートの回答に使うアカウントを作成します">
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="presurvey-name" className="form-label">
            お名前（表示名）
          </label>
          <input
            id="presurvey-name"
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
          <label htmlFor="presurvey-email" className="form-label">
            メールアドレス
          </label>
          <input
            id="presurvey-email"
            type="email"
            className="form-control"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="presurvey-password" className="form-label">
            パスワード（8 文字以上）
          </label>
          <input
            id="presurvey-password"
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
            {loading ? '送信中…' : 'アンケートに進む'}
          </button>
        </div>
      </form>
      <p className="text-center mt-4 mb-0">
        <Link to={`/pre-survey/${eventId}/signin`}>すでに登録済みの方はこちら</Link>
      </p>
    </PreSurveyLayout>
  )
}
