import { useEffect, useState, type FormEvent } from 'react'
import {
  fetchPreSurveyQuestions,
  submitPreSurveyAnswers,
} from '@/features/entry/api/presurveyApi'
import { EntryLayout } from '@/features/entry/components/EntryLayout'
import { PreSurveyQuestionField } from '@/features/entry/components/PreSurveyQuestionField'
import {
  deriveDisplayQuestions,
  reconcileAnswers,
} from '@/features/entry/lib/deriveSurveyQuestions'
import type { PreSurveyAnswers, PreSurveyQuestion } from '@/features/entry/types/presurvey'
import { ApiError } from '@/shared/api/unwrap'

const SURVEY_NOT_CONFIGURED_MESSAGE =
  '事前アンケートの準備ができていません。時間をおいて再度お試しください'

/**
 * S3 ── 事前アンケート回答。
 * 設問はサーバー配信（P-11）。フロントに設問をハードコードしない。
 */
export function SurveyStep({ eventId, onAnswered }: { eventId: string; onAnswered: () => void }) {
  const [questions, setQuestions] = useState<PreSurveyQuestion[]>([])
  const [questionsLoaded, setQuestionsLoaded] = useState(false)
  const [answers, setAnswers] = useState<PreSurveyAnswers>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    let active = true
    fetchPreSurveyQuestions(eventId).then((result) => {
      if (!active) return
      setQuestions(result.questions)
      setQuestionsLoaded(true)
    })
    return () => {
      active = false
    }
  }, [eventId])

  const isSurveyNotConfigured = questionsLoaded && questions.length === 0

  /** 表示用に絞り込んだ設問。連動の判断はすべて純粋関数側にある */
  const displayQuestions = deriveDisplayQuestions(questions, answers)

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
      if (e instanceof ApiError && e.code === 'SURVEY_NOT_CONFIGURED') {
        setError(e.message)
      } else {
        setError('送信に失敗しました。時間をおいて再度お試しください。')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (isSurveyNotConfigured) {
    return (
      <EntryLayout title="事前アンケート" subtitle="ご回答をお願いします">
        <p className="text-danger text-center">{SURVEY_NOT_CONFIGURED_MESSAGE}</p>
      </EntryLayout>
    )
  }

  return (
    <EntryLayout title="事前アンケート" subtitle="ご回答をお願いします">
      <form onSubmit={onSubmit}>
          {displayQuestions.map((question) => (
            <PreSurveyQuestionField
              key={question.id}
              question={question}
              value={answers[question.question_key]}
              onChange={(value) =>
                setAnswers((prev) =>
                  reconcileAnswers(questions, { ...prev, [question.question_key]: value }),
                )
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
    </EntryLayout>
  )
}

function isEmptyAnswer(value: PreSurveyAnswers[string] | undefined): boolean {
  if (value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  return value.trim() === ''
}
