import { describe, expect, it } from 'vitest'
import {
  VERIFY_SUCCESS_ALERT,
  VERIFY_SUCCESS_GUIDANCE,
} from '@/features/auth/pages/VerifyEmailPage/verifySuccessContent'

/**
 * メール確認の成功ページの文言（#133 D1/D2）。
 * このリポジトリには React コンポーネントのレンダリングテスト基盤が無いため、
 * `VerifyEmailPage` が描画に使う文言そのものを検証する。
 * D1（続きへ進むボタンの削除）は、`VerifyEmailPage.tsx` の成功時ブロックに
 * `<Link>` 等のアプリ内遷移要素を置かないことで担保する。
 */
describe('メール確認成功ページの文言（#133）', () => {
  it('T-1/T-2: アプリへ遷移する導線を持たず、元の画面に戻る旨の文言だけを出す', () => {
    expect(VERIFY_SUCCESS_ALERT).toBe('メールアドレスの確認が完了しました')
    expect(VERIFY_SUCCESS_GUIDANCE).toContain('登録を始めた画面に戻り')
    expect(VERIFY_SUCCESS_GUIDANCE).not.toMatch(/続きへ進む/)
  })
})
