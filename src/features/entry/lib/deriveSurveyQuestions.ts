import type {
  PreSurveyAnswerValue,
  PreSurveyAnswers,
  PreSurveyQuestion,
} from '@/features/entry/types/presurvey'

/**
 * 設問間の連動を解決する純粋関数。
 *
 * `top_interest_category`（第1希望を1つ）は、`interest_categories`（複数選択）で
 * 選ばれた分野の中からしか選べない。サーバーは両方に全カテゴリを `options` として返すので
 * （P-10 の動的生成）、**絞り込みはフロントの責務**である。
 *
 * 連動の判定は `question_key` だけで行う。設問の並び順や UUID には依存しない。
 * 分野名・設問文はここに書かない。描画するのは常にサーバーが返した `options`。
 */

/** 「この設問の選択肢は、あの設問で選ばれた value だけ」という依存関係。値はいずれも question_key */
const OPTION_SOURCE_BY_QUESTION_KEY: Record<string, string> = {
  top_interest_category: 'interest_categories',
}

/** 依存元が未選択で、選択肢を出せないときの案内文 */
const EMPTY_SOURCE_NOTICE = '先に興味のある分野を選んでください。'

/** 表示用の設問。`options` は絞り込み済み。`notice` があるときは選択肢の代わりにこれを出す */
export type DisplaySurveyQuestion = PreSurveyQuestion & {
  notice?: string
}

function toValueList(value: PreSurveyAnswerValue | undefined): string[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value !== '') return [value]
  return []
}

/**
 * 回答の現在値から、実際に描画する設問リストを導出する。
 * 依存元が未選択の設問は `options` が空になり、`notice` が付く。
 */
export function deriveDisplayQuestions(
  questions: PreSurveyQuestion[],
  answers: PreSurveyAnswers,
): DisplaySurveyQuestion[] {
  return questions.map((question) => {
    const sourceKey = OPTION_SOURCE_BY_QUESTION_KEY[question.question_key]
    if (!sourceKey) return question

    const allowed = new Set(toValueList(answers[sourceKey]))
    if (allowed.size === 0) {
      return { ...question, options: [], notice: EMPTY_SOURCE_NOTICE }
    }
    return { ...question, options: question.options.filter((o) => allowed.has(o.value)) }
  })
}

/**
 * 依存元から外れた値を持つ回答を落とす。
 * 第1希望に選んだ分野を興味分野から外したときに、送信ペイロードへ不整合な値が
 * 残らないようにする（サーバーが 400 を返す）。
 *
 * 変更が無ければ同じ参照を返すので、`setState` に渡しても余計な再描画を起こさない。
 */
export function reconcileAnswers(
  questions: PreSurveyQuestion[],
  answers: PreSurveyAnswers,
): PreSurveyAnswers {
  let next: PreSurveyAnswers | null = null

  for (const question of questions) {
    const sourceKey = OPTION_SOURCE_BY_QUESTION_KEY[question.question_key]
    if (!sourceKey) continue

    const current = answers[question.question_key]
    if (current === undefined) continue

    const allowed = new Set(toValueList(answers[sourceKey]))
    const kept = toValueList(current).filter((v) => allowed.has(v))
    if (kept.length === toValueList(current).length) continue

    next ??= { ...answers }
    if (Array.isArray(current)) {
      next[question.question_key] = kept
    } else {
      delete next[question.question_key]
    }
  }

  return next ?? answers
}
