import { describe, it, expect, vi } from 'vitest'

const publicGetMock = vi.fn()
const apiPostMock = vi.fn()

vi.mock('@/shared/api/publicClient', () => ({
  publicClient: {
    get: (...args: unknown[]) => publicGetMock(...args),
  },
}))

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    post: (...args: unknown[]) => apiPostMock(...args),
  },
}))

const { fetchPreSurveyQuestions, submitPreSurveyAnswers } = await import(
  '@/features/entry/api/presurveyApi'
)
const { ApiError } = await import('@/shared/api/unwrap')

const QUESTIONS = [
  {
    id: 'q-age',
    question_key: 'age_range',
    label: '年代',
    answer_type: 'single' as const,
    required: true,
    options: [{ value: 'twenties', label: '20代' }],
  },
  {
    id: 'q-interest',
    question_key: 'interest_categories',
    label: '関心のある分野',
    answer_type: 'multi' as const,
    required: true,
    options: [{ value: 'cat-1', label: 'AI・機械学習' }],
  },
]


/** 本番の設問セット（`event-support-recommend/docs/specs/06-pre-survey-requirements.md` §3） */
const PRODUCTION_QUESTIONS = (
  [
    ['interest_categories', 'multi', true],
    ['top_interest_category', 'single', true],
    ['age_range', 'single', true],
    ['occupation', 'single', true],
    ['gender', 'single', false],
    ['exploration_disposition', 'single', true],
  ] as const
).map(([question_key, answer_type, required], i) => ({
  id: `uuid-${i}`,
  question_key,
  label: question_key,
  answer_type,
  required,
  options: [],
}))

describe('fetchPreSurveyQuestions', () => {
  it('公開クライアントで /pre-survey/questions を取得する', async () => {
    publicGetMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          is_pre_survey_open: true,
          pre_survey_closes_at: '2026-10-15T14:59:59.000Z',
          questions: QUESTIONS,
        },
      },
    })

    const result = await fetchPreSurveyQuestions('evt-1')

    expect(publicGetMock).toHaveBeenCalledWith('/events/evt-1/pre-survey/questions')
    expect(result.questions).toEqual(QUESTIONS)
    expect(result.isPreSurveyOpen).toBe(true)
    expect(result.preSurveyClosesAt).toBe('2026-10-15T14:59:59.000Z')
  })
})

describe('submitPreSurveyAnswers', () => {
  it('age_range は専用列へ、それ以外は custom_answers へ振り分けて送信する', async () => {
    apiPostMock.mockResolvedValueOnce({
      data: { success: true, data: { answered_at: '2026-10-15T05:00:00.000Z' } },
    })

    const result = await submitPreSurveyAnswers({
      eventId: 'evt-1',
      answers: { age_range: 'twenties', interest_categories: ['cat-1'] },
      questions: QUESTIONS,
    })

    expect(apiPostMock).toHaveBeenCalledWith('/events/evt-1/survey/answers', {
      age_range: 'twenties',
      custom_answers: { interest_categories: ['cat-1'] },
    })
    expect(result.answered_at).toBe('2026-10-15T05:00:00.000Z')
  })


  it('本番6問を専用列と custom_answers に振り分ける', async () => {
    apiPostMock.mockResolvedValueOnce({
      data: { success: true, data: { answered_at: '2026-10-15T05:00:00.000Z' } },
    })

    await submitPreSurveyAnswers({
      eventId: 'evt-1',
      answers: {
        interest_categories: ['cat-ai', 'cat-iot'],
        top_interest_category: 'cat-ai',
        age_range: 'twenties',
        occupation: 'engineer',
        gender: 'prefer_not_to_say',
        exploration_disposition: 'high',
      },
      questions: PRODUCTION_QUESTIONS,
    })

    expect(apiPostMock).toHaveBeenCalledWith('/events/evt-1/survey/answers', {
      age_range: 'twenties',
      occupation: 'engineer',
      custom_answers: {
        interest_categories: ['cat-ai', 'cat-iot'],
        top_interest_category: 'cat-ai',
        gender: 'prefer_not_to_say',
        exploration_disposition: 'high',
      },
    })
  })

  it('任意設問が未回答なら、そのキーは送らない', async () => {
    apiPostMock.mockResolvedValueOnce({
      data: { success: true, data: { answered_at: '2026-10-15T05:00:00.000Z' } },
    })

    await submitPreSurveyAnswers({
      eventId: 'evt-1',
      answers: { age_range: 'twenties' },
      questions: PRODUCTION_QUESTIONS,
    })

    expect(apiPostMock).toHaveBeenCalledWith('/events/evt-1/survey/answers', {
      age_range: 'twenties',
      custom_answers: {},
    })
  })

  it('締切後の 409 PRE_SURVEY_CLOSED は ApiError として投げる', async () => {
    apiPostMock.mockRejectedValue(
      Object.assign(new Error('Conflict'), {
        isAxiosError: true,
        response: {
          data: { success: false, error: { code: 'PRE_SURVEY_CLOSED', message: '受付は終了しました' } },
        },
      }),
    )

    await expect(
      submitPreSurveyAnswers({ eventId: 'evt-1', answers: {}, questions: QUESTIONS }),
    ).rejects.toMatchObject({ code: 'PRE_SURVEY_CLOSED' })

    await expect(
      submitPreSurveyAnswers({ eventId: 'evt-1', answers: {}, questions: QUESTIONS }),
    ).rejects.toBeInstanceOf(ApiError)
  })
})
