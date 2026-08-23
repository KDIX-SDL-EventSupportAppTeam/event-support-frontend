import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { signInPreSurvey } from '@/features/presurvey/api/presurveyApi'
import { usePreSurveySessionStore } from '@/features/presurvey/store/presurveySessionStore'
import { PreSurveyLayout } from '@/features/presurvey/components/PreSurveyLayout'

/**
 * /pre-survey/:eventId/signin
 * 2 回目以降のサインイン。回答済みなら「回答ありがとう」画面（アプリへの導線あり）へ、
 * 未回答なら入力画面へ進む。
 */
export function PreSurveySignInPage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const setParticipant = usePreSurveySessionStore((s) => s.setParticipant)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const participant = await signInPreSurvey({ eventId, email, password })
      if (!participant) {
        setError('登録が見つかりませんでした。はじめての方はサインアップしてください。')
        return
      }
      setParticipant(participant)
      navigate(
        participant.has_answered
          ? `/pre-survey/${eventId}/thanks`
          : `/pre-survey/${eventId}/form`,
        { replace: true },
      )
    } catch {
      setError('サインインに失敗しました。時間をおいて再度お試しください。')
    } finally {
      setSubmitting(false)
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
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? '確認中…' : 'サインイン'}
          </button>
        </div>
      </form>
      <p className="text-center mt-4 mb-0">
        <Link to={`/pre-survey/${eventId}/signup`}>はじめての方はこちら</Link>
      </p>
    </PreSurveyLayout>
  )
}
