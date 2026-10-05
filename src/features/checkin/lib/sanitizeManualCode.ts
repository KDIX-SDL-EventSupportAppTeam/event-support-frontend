/** ブース手動チェックインのコード桁数。 */
export const MANUAL_CODE_LENGTH = 6

/**
 * 手動コード入力欄の値を正規化する。数字以外（前後の空白・ハイフン等）を除いたうえで先頭6桁に切り詰める。
 * input の maxLength は貼り付け時の空白分の余裕として 8 にしているため、桁数の上限はここで担保する。
 */
export function sanitizeManualCode(raw: string): string {
  return raw.replace(/[^0-9]/g, '').slice(0, MANUAL_CODE_LENGTH)
}
