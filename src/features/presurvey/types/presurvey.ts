/**
 * 事前アンケート（pre-survey）のドメイン型。
 *
 * API 契約の正本: event-support-server `docs/specs/pre-survey/06-api.md` / `02-data-model.md`。
 * 回答値はラフ集合分析（event-support-analytics）の決定表にそのまま載せられるよう、
 * すべて「離散値のコード（option.value）」で保持する。自由記述は分析対象外の補助情報。
 */

/** 質問の回答形式 */
export type PreSurveyAnswerType = 'single' | 'multi' | 'text'

/** 選択肢（value が決定表に載るコード） */
export type PreSurveyOption = {
  value: string
  label: string
}

/**
 * 質問定義。サーバー配信（`GET /events/:event_id/pre-survey/questions`）から取得する。
 * フロントに設問定義をハードコードしない（P-11）。
 */
export type PreSurveyQuestion = {
  /** UUID。表示・React key には使えるが、分析側の識別子ではない */
  id: string
  /** 設問の安定した識別子。回答の送信・分析はこちらで行う（`age_group` / `interest_categories` 等） */
  question_key: string
  label: string
  answer_type: PreSurveyAnswerType
  required: boolean
  /** `interest_categories` はサーバーが `categories` から動的生成して返す（P-10） */
  options: PreSurveyOption[]
}

/**
 * 回答値。
 * - single → 選択された value
 * - multi  → 選択された value の配列
 * - text   → 入力文字列
 */
export type PreSurveyAnswerValue = string | string[]

/** `question_key` → 回答値 */
export type PreSurveyAnswers = Record<string, PreSurveyAnswerValue>

/** 送信結果 */
export type PreSurveySubmission = {
  event_id: string
  answers: PreSurveyAnswers
  /** ISO8601 */
  answered_at: string
}
