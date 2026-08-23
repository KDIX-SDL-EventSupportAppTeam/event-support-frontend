import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  fetchPreSurveyQuestions,
  submitPreSurveyAnswers,
} from '@/features/presurvey/api/presurveyApi'
import { usePreSurveySessionStore } from '@/features/presurvey/store/presurveySessionStore'
import { PreSurveyLayout } from '@/features/presurvey/components/PreSurveyLayout'
import { PreSurveyQuestionField } from '@/features/presurvey/components/PreSurveyQuestionField'
import type {
  PreSurveyAnswers,
  PreSurveyQuestion,
} from '@/features/presurvey/types/presurvey'

/**
 * /pre-survey/:eventId/form
 * ラフ集合分析に使う属性を入力する画面。質問は config/questions.ts の定義から描画する。
 */
export function PreSurveyFormPage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const participant = usePreSurveySessionStore((s) => s.participant)
  const markAnswered = usePreSurveySessionStore((s) => s.markAnswered)

  const [questions, setQuestions] = useState<PreSurveyQuestion[]>([])
  const [answers, setAnswers] = useState<PreSurveyAnswers>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    let active = true
    fetchPreSurveyQuestions(eventId).then((qs) => {
      if (active) setQuestions(qs)
    })
    return () => {
      active = false
    }
  }, [eventId])

  // 未サインインでこの URL を直接開いた場合は入口へ戻す
  if (!participant || participant.event_id !== eventId) {
    return <Navigate to={`/pre-survey/${eventId}`} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const missing = questions.find((q) => q.required && isEmptyAnswer(answers[q.id]))
    if (missing) {
      setError(`「${missing.label}」は必須です。`)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await submitPreSurveyAnswers({
        eventId,
        participantRef: participant!.participant_ref,
        answers,
      })
      markAnswered()
      navigate(`/pre-survey/${eventId}/thanks`, { replace: true })
    } catch {
      setError('送信に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PreSurveyLayout title="事前アンケート" subtitle={`${participant.display_name} さんの回答`}>
      <form onSubmit={onSubmit}>
        {questions.map((question) => (
          <PreSurveyQuestionField
            key={question.id}
            question={question}
            value={answers[question.id]}
            onChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
          />
        ))}
        {error ? <p className="text-danger text-center">{error}</p> : null}
        <div className="d-grid mt-4">
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? '送信中…' : '回答を送信する'}
          </button>
        </div>
      </form>
    </PreSurveyLayout>
  )
}

function isEmptyAnswer(value: PreSurveyAnswers[string] | undefined): boolean {
  if (value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  return value.trim() === ''
}
