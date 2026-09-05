import { describe, expect, it } from 'vitest'
import type { RecommenderStateReason } from '@/shared/api/v1Admin'
import { fallbackLevel, reasonMessage, remainingToNext } from '@/features/admin/lib/recommenderStateView'

describe('reasonMessage', () => {
  it('T-3 4つの reason に専用の文言がある', () => {
    expect(reasonMessage('UNCONFIGURED')).toBe('推薦エンジンが未設定です')
    expect(reasonMessage('UNAUTHORIZED')).toBe('推薦エンジンの認証に失敗しています（設定の問題）')
    expect(reasonMessage('UNREACHABLE')).toBe('推薦エンジンに接続できません')
    expect(reasonMessage('BAD_RESPONSE')).toBe('推薦エンジンの応答が読めません')
  })
  // サーバー側が reason を増やしたとき、運営画面に undefined が出ると
  // 「状態が読めない」ことすら伝わらない。未知のコードでも必ず文言を出す
  it('T-3b 未知の reason でも文言が欠けず、コードがそのまま見える', () => {
    const msg = reasonMessage('SOMETHING_NEW' as RecommenderStateReason)
    expect(msg).not.toContain('undefined')
    expect(msg).toContain('SOMETHING_NEW')
  })
})
describe('remainingToNext', () => {
  it('材料が欠けていれば null（0 を作らない）', () => {
    expect(remainingToNext({})).toBeNull()
    expect(remainingToNext({ snapshot: { decision_table_size: null }, config: { phase_similarity_min: 30, phase_drsa_min: 60 } })).toBeNull()
  })
  it('SIMILARITY / DRSA までの残りを引き算する', () => {
    const cfg = { phase_similarity_min: 30, phase_drsa_min: 60 }
    expect(remainingToNext({ snapshot: { decision_table_size: 12 }, config: cfg })?.label).toBe('SIMILARITY まであと 18 件')
    expect(remainingToNext({ snapshot: { decision_table_size: 45 }, config: cfg })?.label).toBe('DRSA まであと 15 件')
    expect(remainingToNext({ snapshot: { decision_table_size: 60 }, config: cfg })?.label).toContain('到達済み')
  })
})
describe('fallbackLevel', () => {
  it('T-8 10% / 30% で段階が変わる', () => {
    expect(fallbackLevel(0.05)).toBe('ok')
    expect(fallbackLevel(0.1)).toBe('warning')
    expect(fallbackLevel(0.3)).toBe('danger')
  })
})
