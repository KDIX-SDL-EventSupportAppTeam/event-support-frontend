import { describe, expect, it } from 'vitest'
import { isJwtExpired } from '@/features/auth/store/authStore'

/** テスト用に payload だけ正しい JWT 形式の文字列を作る（署名はダミー） */
function makeToken(payload: Record<string, unknown>): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64')
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
})
