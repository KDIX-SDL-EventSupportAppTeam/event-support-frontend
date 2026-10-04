/** サーバーの `z.string().url().max(2048).regex(/^https?:\/\//)` に揃えた上限（issue #177）。 */
export const SURVEY_URL_MAX_LENGTH = 2048

/**
 * 事後アンケート URL（`events.survey_url`）の入力検証。問題が無ければ `null`、あればユーザー向けの文言を返す。
 *
 * サーバーは `z.string().url().max(2048).regex(/^https?:\/\//)` で検証する。長すぎる URL や
 * パースできない URL を送って 422 を踏ませないよう、フロント側にも同じ検証を置く。
 * 空文字は「未設定に戻す」操作なので呼び出し側が先に除外する（ここでは扱わない）。
 */
export function validateSurveyUrl(value: string): string | null {
  if (!/^https?:\/\//.test(value)) return 'アンケートURLは http(s):// で始めてください'
  if (value.length > SURVEY_URL_MAX_LENGTH) {
    return `アンケートURLは ${SURVEY_URL_MAX_LENGTH} 文字以内にしてください`
  }
  try {
    new URL(value)
  } catch {
    return 'URL の形式が正しくありません'
  }
  return null
}
