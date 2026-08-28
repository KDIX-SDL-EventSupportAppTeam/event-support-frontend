import { useEffect, useState, type FormEvent } from 'react'
import {
  fetchPreSurveyQuestions,
  submitPreSurveyAnswers,
} from '@/features/entry/api/presurveyApi'
import { EntryLayout } from '@/features/entry/components/EntryLayout'
import { PreSurveyQuestionField } from '@/features/entry/components/PreSurveyQuestionField'
import { ApiError } from '@/shared/api/unwrap'
import type { PreSurveyAnswers, PreSurveyQuestion } from '@/features/entry/types/presurvey'

/**
 * S3 ── 事前アンケート回答。
 * 設問はサーバー配信（P-11）。フロントに設問をハードコードしない。
 */
export function SurveyStep({ eventId, onAnswered }: { eventId: string; onAnswered: () => void }) {
  const [questions, setQuestions] = useState<PreSurveyQuestion[]>([])
  const [isPreSurveyOpen, setIsPreSurveyOpen] = useState(true)
  const [answers, setAnswers] = useState<PreSurveyAnswers>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    let active = true
    fetchPreSurveyQuestions(eventId).then((result) => {
      if (!active) return
      setQuestions(result.questions)
      setIsPreSurveyOpen(result.isPreSurveyOpen)
    })
    return () => {
      active = false
    }
  }, [eventId])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const missing = questions.find((q) => q.required && isEmptyAnswer(answers[q.question_key]))
    if (missing) {
      setError(`「${missing.label}」は必須です。`)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await submitPreSurveyAnswers({ eventId, answers, questions })
      onAnswered()
    } catch (e) {
      if (e instanceof ApiError && e.code === 'PRE_SURVEY_CLOSED') {
        setIsPreSurveyOpen(false)
        setError('事前アンケートの回答受付は終了しました。')
      } else {
        setError('送信に失敗しました。時間をおいて再度お試しください。')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <EntryLayout title="事前アンケート" subtitle="ご回答をお願いします">
      {!isPreSurveyOpen ? (
        <p className="text-danger text-center mb-0">事前アンケートの回答受付は終了しました。</p>
      ) : (
        <form onSubmit={onSubmit}>
          {questions.map((question) => (
            <PreSurveyQuestionField
              key={question.id}
              question={question}
              value={answers[question.question_key]}
              onChange={(value) =>
                setAnswers((prev) => ({ ...prev, [question.question_key]: value }))
              }
            />
          ))}
          {error ? <p className="text-danger text-center">{error}</p> : null}
          <div className="d-grid mt-4">
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? '送信中…' : '回答を送信する'}
            </button>
          </div>
        </form>
      )}
    </EntryLayout>
  )
}

function isEmptyAnswer(value: PreSurveyAnswers[string] | undefined): boolean {
  if (value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  return value.trim() === ''
}
