import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/unwrap'
import {
  MANUAL_CODE_NOT_FOUND_MSG,
  manualCheckInErrorMessage,
  toManualCodeForSubmit,
} from '@/features/checkin/lib/manualCheckIn'

describe('toManualCodeForSubmit', () => {
  it('T-4 空欄・空白のみは送れない（null）', () => {
    expect(toManualCodeForSubmit('')).toBeNull()
    expect(toManualCodeForSubmit('   ')).toBeNull()
  })
  it('T-5 前後の空白は落として送る（server の max(6) が trim 前に掛かるため）', () => {
    expect(toManualCodeForSubmit('  AI001 ')).toBe('AI001')
    expect(toManualCodeForSubmit(' ABC123 ')).toBe('ABC123')
  })
  it('T-6 大文字小文字は変えない（照合はサーバーが UPPER で行う）', () => {
    expect(toManualCodeForSubmit('ai001')).toBe('ai001')
    expect(toManualCodeForSubmit('Ai001')).toBe('Ai001')
  })
  it('6 文字ちょうどは通り、7 文字は送れない', () => {
    expect(toManualCodeForSubmit('ABC123')).toBe('ABC123')
    expect(toManualCodeForSubmit('ABC1234')).toBeNull()
  })
  it('5 文字（運営画面の例 AI001）も送れる', () => {
    expect(toManualCodeForSubmit('AI001')).toBe('AI001')
  })
})

describe('manualCheckInErrorMessage', () => {
  it('T-2 NOT_FOUND は「コードが違う」と分かる文言になる（汎用エラーにしない）', () => {
    const e = new ApiError('NOT_FOUND', '手動コードに一致するブースがありません')
    expect(manualCheckInErrorMessage(e, '失敗')).toBe(MANUAL_CODE_NOT_FOUND_MSG)
    expect(MANUAL_CODE_NOT_FOUND_MSG).toContain('コードが違います')
  })
  it('VALIDATION_ERROR は入力形式の文言になる', () => {
    expect(manualCheckInErrorMessage(new ApiError('VALIDATION_ERROR', '入力が不正です'), '失敗')).toContain('6文字以内')
  })
  it('その他の ApiError はサーバーの message、ApiError 以外は fallback', () => {
    expect(manualCheckInErrorMessage(new ApiError('COOLDOWN', 'クールタイム中です（残り30秒）'), '失敗')).toBe('クールタイム中です（残り30秒）')
    expect(manualCheckInErrorMessage(new Error('boom'), '失敗')).toBe('失敗')
  })
})
