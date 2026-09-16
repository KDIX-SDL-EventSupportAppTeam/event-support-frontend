import { describe, expect, it } from 'vitest'
import {
  deriveDisplayQuestions,
  reconcileAnswers,
} from '@/features/entry/lib/deriveSurveyQuestions'
import type { PreSurveyQuestion } from '@/features/entry/types/presurvey'

/**
 * `top_interest_category` を `interest_categories` に連動させる純粋関数の担保。
 * 分野名はサーバー由来なので、テストでも「サーバーが返した値」として与える。
 */
const CATEGORY_OPTIONS = [
  { value: 'cat-ai', label: 'AI・機械学習' },
  { value: 'cat-iot', label: 'IoT' },
  { value: 'cat-xr', label: 'XR' },
]

/** 並び順・UUID に依存しないことを見るため、第1希望を興味分野より前に置いている */
const QUESTIONS: PreSurveyQuestion[] = [
  {
    id: 'uuid-top',
    question_key: 'top_interest_category',
    label: '一番興味がある分野',
    answer_type: 'single',
    required: true,
    options: CATEGORY_OPTIONS,
  },
  {
    id: 'uuid-interest',
    question_key: 'interest_categories',
    label: '興味のある分野',
    answer_type: 'multi',
    required: true,
    options: CATEGORY_OPTIONS,
  },
  {
    id: 'uuid-age',
    question_key: 'age_range',
    label: '年代',
    answer_type: 'single',
    required: true,
    options: [{ value: 'twenties', label: '20代' }],
  },
]

function topOf(answers: Parameters<typeof deriveDisplayQuestions>[1]) {
  return deriveDisplayQuestions(QUESTIONS, answers).find(
    (q) => q.question_key === 'top_interest_category',
  )!
}

describe('deriveDisplayQuestions', () => {
  it('興味分野が未選択なら第1希望の選択肢は空で、案内文が出る', () => {
    const top = topOf({})
    expect(top.options).toEqual([])
    expect(top.notice).toBe('先に興味のある分野を選んでください。')
  })

  it('興味分野を空配列にしたときも案内文が出る', () => {
    expect(topOf({ interest_categories: [] }).notice).toBeTruthy()
  })

  it('2分野を選ぶと第1希望はその2択になる', () => {
    const top = topOf({ interest_categories: ['cat-ai', 'cat-xr'] })
    expect(top.options).toEqual([
      { value: 'cat-ai', label: 'AI・機械学習' },
      { value: 'cat-xr', label: 'XR' },
    ])
    expect(top.notice).toBeUndefined()
  })

  it('連動しない設問はそのまま返す', () => {
    const derived = deriveDisplayQuestions(QUESTIONS, { interest_categories: ['cat-ai'] })
    const age = derived.find((q) => q.question_key === 'age_range')!
    expect(age).toBe(QUESTIONS[2])
  })

  it('入力の設問配列と回答を書き換えない', () => {
    const answers = { interest_categories: ['cat-ai'] }
    deriveDisplayQuestions(QUESTIONS, answers)
    expect(QUESTIONS[0].options).toEqual(CATEGORY_OPTIONS)
    expect(answers).toEqual({ interest_categories: ['cat-ai'] })
  })
})

describe('reconcileAnswers', () => {
  it('第1希望に選んだ分野を興味分野から外すと第1希望がクリアされる', () => {
    const next = reconcileAnswers(QUESTIONS, {
      interest_categories: ['cat-iot'],
      top_interest_category: 'cat-ai',
      age_range: 'twenties',
    })
    expect(next.top_interest_category).toBeUndefined()
    expect(next).not.toHaveProperty('top_interest_category')
    expect(next.age_range).toBe('twenties')
  })

  it('第1希望が興味分野に残っていれば維持する', () => {
    const answers = {
      interest_categories: ['cat-ai', 'cat-iot'],
      top_interest_category: 'cat-ai',
    }
    expect(reconcileAnswers(QUESTIONS, answers)).toBe(answers)
  })

  it('興味分野を全部外すと第1希望もクリアされる', () => {
    const next = reconcileAnswers(QUESTIONS, {
      interest_categories: [],
      top_interest_category: 'cat-ai',
    })
    expect(next).not.toHaveProperty('top_interest_category')
  })
})
