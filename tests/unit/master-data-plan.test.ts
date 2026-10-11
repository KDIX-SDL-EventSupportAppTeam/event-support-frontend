import { describe, expect, it } from 'vitest'
import { planCreations } from '@/features/admin/lib/masterDataPreset'

describe('planCreations（カテゴリ・アワード一括登録の作成対象）', () => {
  it('空行は無視し、既存名と入力内の重複はスキップする', () => {
    const rows = [{ name: ' A ' }, { name: '' }, { name: 'B' }, { name: 'A' }, { name: 'C' }]
    const { toCreate, skipped } = planCreations(rows, ['B'])
    expect(toCreate.map((r) => r.name)).toEqual(['A', 'C'])
    expect(skipped).toEqual([{ name: 'B' }, { name: 'A' }])
  })
})
