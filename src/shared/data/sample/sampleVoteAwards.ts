import type { Award } from '@/shared/types/award'

/**
 * サンプルモードのアワード（issue #89 で `Award` 型に統合）。
 * 投票のキーは `id`（賞名ではない）。
 */
export const SAMPLE_VOTE_AWARDS: Award[] = [
  {
    id: 'sample-award-visitor',
    name: '来場者賞',
    description: 'チェックインしたブースの中から、最も印象に残った展示に投票してください。',
    color: 'pink',
    sort_order: 0,
  },
  {
    id: 'sample-award-staff',
    name: 'スタッフ賞',
    description: '運営スタッフおすすめの展示を選ぶ部門です。',
    color: 'purple',
    sort_order: 1,
  },
]
