/**
 * 監査ログ action の日本語ラベルと種別分類。
 * 未知の action は生文字列をそのまま表示する（将来の action 追加で壊れないように）。
 */

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'booth.create': 'ブース作成',
  'booth.update': 'ブース更新',
  'booth.delete': 'ブース削除',
  'category.create': 'カテゴリ作成',
  'category.update': 'カテゴリ更新',
  'category.delete': 'カテゴリ削除',
  'survey_question.create': '設問作成',
  'survey_question.update': '設問更新',
  'survey_question.delete': '設問削除',
  'staff.invite': 'スタッフ招待',
  'staff.role_change': 'スタッフロール変更',
  'staff.remove': 'スタッフ削除',
}

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action
}

export type AuditActionCategory = 'all' | 'booth' | 'category' | 'survey_question' | 'staff'

export const AUDIT_CATEGORY_FILTERS: { key: AuditActionCategory; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'booth', label: 'ブース' },
  { key: 'category', label: 'カテゴリ' },
  { key: 'survey_question', label: '設問' },
  { key: 'staff', label: 'スタッフ' },
]

/** action の接頭辞（'booth.create' → 'booth'）でカテゴリ判定する。 */
export function matchesCategory(action: string, category: AuditActionCategory): boolean {
  if (category === 'all') return true
  return action.startsWith(`${category}.`)
}
