/**
 * メール確認の成功ページが出す案内文（D1/D2）。
 * アプリへ遷移するボタン・リンクは出さず、元の画面に戻る旨だけを伝える。
 */
export const VERIFY_SUCCESS_ALERT = 'メールアドレスの確認が完了しました'
export const VERIFY_SUCCESS_GUIDANCE =
  '登録を始めた画面に戻り、「確認しました」を押してください。このページは閉じてかまいません。'

/**
 * 確認済みのリンクを開き直したとき（サーバーが already_verified: true を返す、#232）。
 * メールから開いたブラウザは登録時と別で、ログイン状態が引き継がれないため、
 * ここでもアプリへの遷移は置かず、元のブラウザから開くよう文言だけで案内する（#133）。
 */
export const VERIFY_ALREADY_ALERT = 'メールアドレスは確認済みです'
export const VERIFY_ALREADY_GUIDANCE =
  'アプリは、最初に登録したときのブラウザ（配布された URL）から開いてください。このページは閉じてかまいません。'

/** 404 TOKEN_INVALID（再送前の古いメールのリンクなど）の案内。 */
export const VERIFY_INVALID_ALERT =
  'この確認リンクは無効です。すでに確認済みの場合、アプリは最初に登録したときのブラウザ（配布された URL）から開いてください'

/** verify-email の成功応答を表示状態に振り分ける。already_verified を返さない旧サーバーでは従来の成功表示。 */
export function verifiedStatusKind(res: { already_verified?: boolean }): 'success' | 'already_verified' {
  return res.already_verified ? 'already_verified' : 'success'
}
