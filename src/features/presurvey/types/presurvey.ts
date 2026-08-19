/**
 * 事前アンケート（pre-survey）のドメイン型。
 *
 * 回答値はラフ集合分析（event-support-analytics）の決定表にそのまま載せられるよう、
 * すべて「離散値のコード（choice.value）」で保持する。自由記述は分析対象外の補助情報。
 */

/** 質問の回答形式 */
export type PreSurveyQuestionType = 'single' | 'multi' | 'text'

/** 選択肢（value が決定表に載るコード） */
export type PreSurveyChoice = {
  value: string
  label: string
}

/** 質問定義（config/questions.ts が正本） */
export type PreSurveyQuestion = {
  /** 決定表の属性名になる。サーバー・DB のカラム／キーと一致させる */
  id: string
  label: string
  type: PreSurveyQuestionType
  required: boolean
  /** type が 'single' | 'multi' のとき必須 */
  choices?: PreSurveyChoice[]
  /** 補足説明（任意） */
  help?: string
}

/**
 * 回答値。
 * - single → 選択された value
 * - multi  → 選択された value の配列
 * - text   → 入力文字列
 */
export type PreSurveyAnswerValue = string | string[]

/** 質問 id → 回答値 */
export type PreSurveyAnswers = Record<string, PreSurveyAnswerValue>

/** サーバー送信ペイロード（API 接続時にそのまま JSON body にする想定） */
export type PreSurveySubmission = {
  event_id: string
  /** 回答者の識別子。サインアップ／サインインで確定する */
  participant_ref: string
  answers: PreSurveyAnswers
  /** ISO8601 */
  answered_at: string
}

/** 回答者（事前アンケートの中でだけ使う軽量な参加者情報） */
export type PreSurveyParticipant = {
  participant_ref: string
  event_id: string
  email: string
  display_name: string
  /** 既に回答済みか。true なら入力画面を飛ばして完了画面へ */
  has_answered: boolean
}
