/**
 * 監査ログの `action` コード（`target.verb` 形式）を日本語ラベルと
 * バッジ色に変換する。サーバーが新しい action を追加しても、
 * 既知の target / verb の組み合わせなら自動で日本語化される。
 */

/** action の前半（対象）→ 日本語名 */
const TARGET_LABELS: Record<string, string> = {
  staff: 'スタッフ',
  booth: 'ブース',
  category: 'カテゴリ',
  survey_question: 'アンケート設問',
}

/** action の後半（操作）→ 日本語名とバッジ色（Bootstrap のカラー名） */
const VERB_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: '作成', color: 'success' },
  update: { label: '更新', color: 'info' },
  delete: { label: '削除', color: 'danger' },
  invite: { label: '追加', color: 'primary' },
}

export type AuditActionView = {
  /** 例: 「ブースを作成」 */
  label: string
  /** Bootstrap カラー名（例: success）。`bg-${color}` として使う */
  color: string
}

export function resolveAuditAction(action: string): AuditActionView {
  const [target, verb] = action.split('.')
  const targetLabel = TARGET_LABELS[target] ?? target
  const verbEntry = VERB_LABELS[verb] ?? { label: verb ?? action, color: 'secondary' }
  return {
    label: `${targetLabel}を${verbEntry.label}`,
    color: verbEntry.color,
  }
}

/** 操作者の権限コード → 日本語ラベル */
export function resolveActorRoleLabel(role: string): string {
  switch (role) {
    case 'manager':
      return '管理者'
    case 'viewer':
      return '閲覧者'
    case 'organizer':
      return '主催者'
    default:
      return role
  }
}
