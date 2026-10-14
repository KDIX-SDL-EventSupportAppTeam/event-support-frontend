import { describe, expect, it } from 'vitest'
import type { RecommenderStateReason } from '@/shared/api/v1Admin'
import { fallbackLevel, phaseLabel, reasonMessage, remainingToNext } from '@/features/admin/lib/recommenderStateView'

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
    expect(remainingToNext({ snapshot: { decision_table_size: 12 }, config: { phase_similarity_min: 30 } })).toBeNull()
  })
  // 段階は「ランダム → DRSA」（recommend ADR 0010）。SIMILARITY は自動では使わないので、しきい値として出さない
  it('次のしきい値は常に DRSA（SIMILARITY を出さない）', () => {
    const cfg = { phase_similarity_min: 30, phase_drsa_min: 60 }
    expect(remainingToNext({ snapshot: { decision_table_size: 0 }, config: cfg })?.label).toBe('DRSA まであと 60 件')
    expect(remainingToNext({ snapshot: { decision_table_size: 12 }, config: cfg })?.label).toBe('DRSA まであと 48 件')
    expect(remainingToNext({ snapshot: { decision_table_size: 45 }, config: cfg })?.label).toBe('DRSA まであと 15 件')
    expect(remainingToNext({ snapshot: { decision_table_size: 60 }, config: cfg })?.label).toContain('到達済み')
    expect(remainingToNext({ snapshot: { decision_table_size: 12 }, config: { phase_drsa_min: 60 } })?.label).toBe('DRSA まであと 48 件')
  })
})
describe('phaseLabel', () => {
  it('COVERAGE はランダム期と分かる表示にし、契約の値も残す', () => {
    expect(phaseLabel('COVERAGE')).toBe('ランダム（COVERAGE）')
    expect(phaseLabel('DRSA')).toBe('DRSA')
    expect(phaseLabel('SIMILARITY')).toContain('SIMILARITY')
  })
  it('未知の値はそのまま、無ければ null', () => {
    expect(phaseLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW')
    expect(phaseLabel(undefined)).toBeNull()
    expect(phaseLabel('')).toBeNull()
  })
})
describe('fallbackLevel', () => {
  it('T-8 10% / 30% で段階が変わる', () => {
    expect(fallbackLevel(0.05)).toBe('ok')
    expect(fallbackLevel(0.1)).toBe('warning')
    expect(fallbackLevel(0.3)).toBe('danger')
  })
})
