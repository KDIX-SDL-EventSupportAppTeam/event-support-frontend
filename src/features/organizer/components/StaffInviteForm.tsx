import { FormEvent, useState } from 'react'
import { inviteOrganizerStaff, type InvitedStaff } from '@/features/organizer/api/organizerApi'

type Props = {
  eventId: string
  /** 招待成功時に呼ばれる。詳細画面ではスタッフ一覧の再取得に使う。 */
  onInvited?: () => void
}

const ROLE_LABELS: Record<'manager' | 'viewer', string> = {
  manager: '管理者',
  viewer: '閲覧者',
}

/**
 * スタッフ招待フォーム。
 * 送信のたびに招待済みスタッフ一覧に追加する。
 */
export function StaffInviteForm({ eventId, onInvited }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<'manager' | 'viewer'>('viewer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitedList, setInvitedList] = useState<InvitedStaff[]>([])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const staff = await inviteOrganizerStaff(eventId, {
        email,
        password,
        display_name: displayName || undefined,
        role,
      })
      setInvitedList((prev) => [...prev, staff])
      setEmail('')
      setPassword('')
      setDisplayName('')
      setRole('viewer')
      onInvited?.()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message ?? 'スタッフの追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="h6 fw-semibold mb-3">
        <i className="bi bi-person-plus me-1" />
        スタッフを追加する
      </h2>

      <form onSubmit={onSubmit}>
        <div className="row g-2 mb-2">
          <div className="col-md-4">
            <label className="form-label small">メールアドレス *</label>
            <input
              type="email"
              className="form-control form-control-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label small">パスワード *</label>
            <input
              type="password"
              className="form-control form-control-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label small">表示名</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label small">権限</label>
            <select
              className="form-select form-select-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as 'manager' | 'viewer')}
            >
              <option value="viewer">{ROLE_LABELS.viewer}</option>
              <option value="manager">{ROLE_LABELS.manager}</option>
            </select>
          </div>
        </div>
        {error ? <p className="text-danger small mb-2">{error}</p> : null}
        <button type="submit" className="btn btn-sm btn-primary" disabled={loading}>
          {loading ? '追加中…' : '追加する'}
        </button>
      </form>

      {invitedList.length > 0 && (
        <div className="mt-3">
          <p className="small fw-semibold text-muted mb-1">招待済みスタッフ</p>
          <ul className="list-group list-group-flush">
            {invitedList.map((s) => (
              <li key={s.id} className="list-group-item list-group-item-sm d-flex align-items-center gap-2 px-0">
                <i className="bi bi-person-check text-success" />
                <span className="small">
                  {s.email}
                  {s.display_name ? ` (${s.display_name})` : ''}
                </span>
                <span
                  className={`badge ms-auto ${s.role === 'manager' ? 'bg-warning text-dark' : 'bg-secondary'}`}
                >
                  {ROLE_LABELS[s.role]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
