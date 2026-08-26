import { apiClient } from '@/shared/api/client'
import { publicClient } from '@/shared/api/publicClient'
import { toApiError, unwrapApiData } from '@/shared/api/unwrap'
import type { ApiResponse } from '@/shared/types/api'
import type {
  PreSurveyAnswers,
  PreSurveyQuestion,
  PreSurveySubmission,
} from '@/features/presurvey/types/presurvey'

/**
 * 事前アンケートのデータアクセス層。画面はこのモジュールの関数だけを呼ぶ。
 * API 契約の正本: event-support-server `docs/specs/pre-survey/06-api.md`。
 */

export type PreSurveyQuestionsResult = {
  questions: PreSurveyQuestion[]
  isPreSurveyOpen: boolean
  preSurveyClosesAt: string | null
}

/** 設問一覧の取得。未ログインでも呼べる公開エンドポイント。 */
export async function fetchPreSurveyQuestions(eventId: string): Promise<PreSurveyQuestionsResult> {
  const res = await publicClient.get<
    ApiResponse<{
      is_pre_survey_open: boolean
      pre_survey_closes_at: string | null
      questions: PreSurveyQuestion[]
    }>
  >(`/events/${encodeURIComponent(eventId)}/pre-survey/questions`)
  const data = unwrapApiData(res)
  return {
    questions: data.questions,
    isPreSurveyOpen: data.is_pre_survey_open,
    preSurveyClosesAt: data.pre_survey_closes_at,
  }
}

/** `age_range` / `occupation` / `industry` は専用列と `custom_answers` の両方に載せる（02-data-model.md） */
const TOP_LEVEL_KEYS = new Set(['age_range', 'occupation', 'industry'])

type SurveyAnswersBody = {
  age_range?: string
  occupation?: string
  industry?: string
  custom_answers: Record<string, unknown>
}

/** 回答値を送信ペイロードへ整形する。`question_key` を持たない設問は送らない。 */
function buildAnswersBody(answers: PreSurveyAnswers, questions: PreSurveyQuestion[]): SurveyAnswersBody {
  const body: SurveyAnswersBody = { custom_answers: {} }
  for (const question of questions) {
    const value = answers[question.question_key]
    if (value === undefined) continue
    if (TOP_LEVEL_KEYS.has(question.question_key) && typeof value === 'string') {
      ;(body as Record<string, unknown>)[question.question_key] = value
    } else {
      body.custom_answers[question.question_key] = value
    }
  }
  return body
}

/**
 * 回答送信。Bearer 認証必須（サインアップ／サインインは `features/auth` の
 * `useAuth().register` / `useAuth().login` を使う）。
 * 締切後は 409（`code: 'PRE_SURVEY_CLOSED'`）を ApiError で投げる。
 */
export async function submitPreSurveyAnswers(params: {
  eventId: string
  answers: PreSurveyAnswers
  questions: PreSurveyQuestion[]
}): Promise<PreSurveySubmission> {
  const body = buildAnswersBody(params.answers, params.questions)
  try {
    const res = await apiClient.post<ApiResponse<{ answered_at: string }>>(
      `/events/${encodeURIComponent(params.eventId)}/survey/answers`,
      body,
    )
    const data = unwrapApiData(res)
    return {
      event_id: params.eventId,
      answers: params.answers,
      answered_at: data.answered_at,
    }
  } catch (e) {
    throw toApiError(e)
  }
}
