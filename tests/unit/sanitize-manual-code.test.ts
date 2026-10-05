import { describe, expect, it } from 'vitest'
import { MANUAL_CODE_LENGTH, sanitizeManualCode } from '@/features/checkin/lib/sanitizeManualCode'

describe('sanitizeManualCode', () => {
  it('6桁の数字はそのまま', () => {
    expect(sanitizeManualCode('481502')).toBe('481502')
  })

  it.each([
    ['7桁', '4815023'],
    ['8桁', '48150237'],
  ])('数字だけで%s入れても6桁に切り詰める', (_label, raw) => {
    expect(sanitizeManualCode(raw)).toBe('481502')
  })

  it('前後に空白のある貼り付けでも6桁が欠けない（#103）', () => {
    expect(sanitizeManualCode(' 481502 ')).toBe('481502')
  })

  it('数字以外を除去する', () => {
    expect(sanitizeManualCode('48-15a02')).toBe('481502')
  })

  it('入力途中（6桁未満）はそのまま返す', () => {
    expect(sanitizeManualCode('481')).toBe('481')
    expect(sanitizeManualCode('')).toBe('')
  })

  it('結果は常に MANUAL_CODE_LENGTH 以下', () => {
    expect(sanitizeManualCode('1234567890'.repeat(3)).length).toBe(MANUAL_CODE_LENGTH)
  })
})
