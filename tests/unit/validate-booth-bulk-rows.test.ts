import { describe, expect, it } from 'vitest'
import {
  emptyBoothBulkRow,
  submittableBoothBulkRows,
  validateBoothBulkRows,
  type BoothBulkRow,
} from '@/features/admin/lib/validateBoothBulkRows'
import { BOOTH_BULK_TEMPLATE } from '@/features/admin/lib/boothBulkTemplate'

function row(patch: Partial<BoothBulkRow>): BoothBulkRow {
  return { ...emptyBoothBulkRow('k'), ...patch }
}

describe('validateBoothBulkRows', () => {
  it('完全に空の行は isBlank=true でエラーは出さない', () => {
    const [result] = validateBoothBulkRows([emptyBoothBulkRow('a')])
    expect(result.isBlank).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('ブース名が無い行はエラーになる（他の欄が埋まっていれば空行扱いしない）', () => {
    const [result] = validateBoothBulkRows([row({ key: 'a', displayCode: '1' })])
    expect(result.isBlank).toBe(false)
    expect(result.errors).toContain('ブース名は必須です')
  })

  it('表の中でブース番号が重複したら両方エラーになる', () => {
    const results = validateBoothBulkRows([
      row({ key: 'a', displayCode: '7', name: 'A' }),
      row({ key: 'b', displayCode: '7', name: 'B' }),
    ])
    expect(results[0].errors).toContain('ブース番号がこの表の中で重複しています')
    expect(results[1].errors).toContain('ブース番号がこの表の中で重複しています')
  })

  it('番号が空欄同士は重複扱いしない', () => {
    const results = validateBoothBulkRows([
      row({ key: 'a', name: 'A' }),
      row({ key: 'b', name: 'B' }),
    ])
    expect(results[0].errors).toEqual([])
    expect(results[1].errors).toEqual([])
  })

  it('submittableBoothBulkRows は空行とエラー行を除く', () => {
    const validated = validateBoothBulkRows([
      emptyBoothBulkRow('blank'),
      row({ key: 'bad', displayCode: '1' }), // 名前なし = エラー
      row({ key: 'ok', displayCode: '2', name: 'ブースA' }),
    ])
    const submittable = submittableBoothBulkRows(validated)
    expect(submittable.map((r) => r.key)).toEqual(['ok'])
  })
})

describe('BOOTH_BULK_TEMPLATE', () => {
  it('39件、番号1〜39が重複なく揃っている', () => {
    expect(BOOTH_BULK_TEMPLATE).toHaveLength(39)
    const codes = BOOTH_BULK_TEMPLATE.map((t) => t.displayCode).sort((a, b) => Number(a) - Number(b))
    expect(codes).toEqual(Array.from({ length: 39 }, (_, i) => String(i + 1)))
  })

  it('全行にブース名が入っている', () => {
    for (const t of BOOTH_BULK_TEMPLATE) {
      expect(t.name.trim()).not.toBe('')
    }
  })

  it('テンプレートをそのまま validateBoothBulkRows に通してもエラーが出ない', () => {
    const rows: BoothBulkRow[] = BOOTH_BULK_TEMPLATE.map((t, i) => ({
      key: `t${i}`,
      displayCode: t.displayCode,
      name: t.name,
      genre: '',
      description: t.description,
      tags: '',
    }))
    const validated = validateBoothBulkRows(rows)
    expect(validated.every((r) => r.errors.length === 0)).toBe(true)
    expect(submittableBoothBulkRows(validated)).toHaveLength(39)
  })
})
