import { describe, expect, it } from 'vitest'
import { isJwtExpired } from '@/shared/auth/authStore'

/**
 * テスト用に payload だけ正しい JWT 形式の文字列を作る（署名はダミー）。
 * 実物の JWT と同じ base64url（`-`/`_`・パディングなし）でエンコードする。
 * 以前は標準 base64 で作っていたため、base64url 特有の文字で atob が例外になる
 * バグ（有効なセッションがリロードで破棄される）をすり抜けていた。
 */
function makeToken(payload: Record<string, unknown>): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`
}

const nowSec = Math.floor(Date.now() / 1000)

describe('isJwtExpired', () => {
  it('exp が過去 → 期限切れ(true)', () => {
    expect(isJwtExpired(makeToken({ exp: nowSec - 10 }))).toBe(true)
  })

  it('exp が未来 → 有効(false)', () => {
    expect(isJwtExpired(makeToken({ exp: nowSec + 3600 }))).toBe(false)
  })

  it('exp が無い → 判定不能なので保持(false)', () => {
    expect(isJwtExpired(makeToken({ sub: 'user-1' }))).toBe(false)
  })

  it('壊れたトークン → 無効(true)', () => {
    expect(isJwtExpired('not-a-jwt')).toBe(true)
  })

  it('base64url 特有の文字（-/_）を含む有効トークン → 期限切れ扱いにしない(false)', () => {
    // 実運用で起きた回帰: 日本語 display_name 入りの payload は base64url で - や _ を含み、
    // atob 直渡しだと例外 → 「壊れたトークン」誤判定 → リロードのたびにログアウトされていた
    const token = makeToken({
      exp: nowSec + 3600,
      display_name: '開発用オーガナイザー',
      scope: 'organizer',
    })
    expect(token.split('.')[1]).toMatch(/[-_]/) // 前提: base64url特有文字が実際に含まれる
    expect(isJwtExpired(token)).toBe(false)
  })

  it('base64url 特有の文字を含む期限切れトークン → 期限切れ(true)', () => {
    const token = makeToken({
      exp: nowSec - 10,
      display_name: '開発用オーガナイザー',
      scope: 'organizer',
    })
    expect(token.split('.')[1]).toMatch(/[-_]/)
    expect(isJwtExpired(token)).toBe(true)
  })
})
