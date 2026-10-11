/** 参加者・出展者のロール表示（運営画面の一覧で共通に使う） */
export function RoleBadge({ role }: { role: 'participant' | 'exhibitor' }) {
  return role === 'exhibitor' ? (
    <span className="badge text-bg-warning">
      <i className="bi bi-shop me-1" />
      出展者
    </span>
  ) : (
    <span className="badge text-bg-primary">
      <i className="bi bi-person me-1" />
      参加者
    </span>
  )
}
