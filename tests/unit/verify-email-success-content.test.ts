import { describe, expect, it } from 'vitest'
import {
  VERIFY_ALREADY_ALERT,
  VERIFY_ALREADY_GUIDANCE,
  VERIFY_INVALID_ALERT,
  VERIFY_SUCCESS_ALERT,
  VERIFY_SUCCESS_GUIDANCE,
  verifiedStatusKind,
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

describe('確認済みの再訪と無効リンクの文言（#232）', () => {
  it('already_verified: true は確認済み表示に振り分け、無ければ従来の成功表示（D1/D2 のまま）', () => {
    expect(verifiedStatusKind({ already_verified: true })).toBe('already_verified')
    expect(verifiedStatusKind({})).toBe('success')
    expect(verifiedStatusKind({ already_verified: false })).toBe('success')
  })

  it('確認済みの文言は元のブラウザから開く案内だけで、アプリへ遷移する導線を持たない', () => {
    expect(VERIFY_ALREADY_ALERT).toBe('メールアドレスは確認済みです')
    expect(VERIFY_ALREADY_GUIDANCE).toContain('最初に登録したときのブラウザ')
    expect(VERIFY_ALREADY_GUIDANCE).toContain('このページは閉じてかまいません')
    expect(VERIFY_ALREADY_GUIDANCE).not.toMatch(/続きへ進む|サインイン|アプリを開く/)
  })

  it('404 の文言は、最初に登録したブラウザから開く旨を含む', () => {
    expect(VERIFY_INVALID_ALERT).toContain('この確認リンクは無効です')
    expect(VERIFY_INVALID_ALERT).toContain('最初に登録したときのブラウザ')
  })
})
