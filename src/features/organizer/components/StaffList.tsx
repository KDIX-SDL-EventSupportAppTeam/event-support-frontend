import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  listOrganizerStaff,
  removeOrganizerStaff,
  updateOrganizerStaffRole,
  type Staff,
  type StaffRole,
} from '@/features/organizer/api/organizerApi'
import { StaffInviteForm } from '@/features/organizer/components/StaffInviteForm'
import { formatClientError } from '@/shared/lib/formatClientError'

const ROLE_LABELS: Record<StaffRole, string> = {
  manager: '管理者',
  viewer: '閲覧者',
}

type Props = {
  eventId: string
}

/**
 * 詳細画面のスタッフ管理セクション。
 * 一覧・ロール変更・削除・招待（StaffInviteForm 再利用）をまとめる。
 * 最後の管理者はロール変更・削除できない（サーバーと二重のガード）。
 */
export function StaffList({ eventId }: Props) {
  const [staff, setStaff] = useState<Staff[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rowError, setRowError] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showInvite, setShowInvite] = useState(false)

  const reload = useCallback(() => {
    setError(null)
    return listOrganizerStaff(eventId)
      .then(setStaff)
      .catch((e) => setError(formatClientError(e, 'スタッフ一覧の取得に失敗しました')))
  }, [eventId])

  useEffect(() => {
    void reload()
  }, [reload])

  const managerCount = useMemo(
    () => (staff ?? []).filter((s) => s.role === 'manager').length,
    [staff],
  )

  function setRowErr(userId: string, message: string | null) {
    setRowError((prev) => {
      const next = { ...prev }
      if (message) next[userId] = message
      else delete next[userId]
      return next
    })
  }

  async function onChangeRole(target: Staff, role: StaffRole) {
    if (role === target.role) return
    if (!window.confirm(`${target.display_name || target.email} のロールを「${ROLE_LABELS[role]}」に変更します。よろしいですか？`)) {
      return
    }
    setBusyId(target.id)
    setRowErr(target.id, null)
    try {
      const updated = await updateOrganizerStaffRole(eventId, target.id, role)
      setStaff((prev) => (prev ?? []).map((s) => (s.id === updated.id ? updated : s)))
    } catch (e) {
      setRowErr(target.id, formatClientError(e, 'ロールの変更に失敗しました'))
    } finally {
      setBusyId(null)
    }
  }

  async function onRemove(target: Staff) {
    if (!window.confirm(`${target.display_name || target.email} を削除します。このスタッフはログインできなくなります。よろしいですか？`)) {
      return
    }
    setBusyId(target.id)
    setRowErr(target.id, null)
    try {
      await removeOrganizerStaff(eventId, target.id)
      setStaff((prev) => (prev ?? []).filter((s) => s.id !== target.id))
    } catch (e) {
      setRowErr(target.id, formatClientError(e, 'スタッフの削除に失敗しました'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h2 className="h5 fw-bold mb-3">
        <i className="bi bi-people me-2" />
        スタッフ管理
      </h2>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      {!staff && !error ? <p className="text-muted">読み込み中…</p> : null}

      {staff ? (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr className="small text-muted">
                <th>表示名 / メール</th>
                <th>ロール</th>
                <th>追加日</th>
                <th className="text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => {
                const isLastManager = s.role === 'manager' && managerCount <= 1
                const disabled = busyId === s.id || isLastManager
                return (
                  <tr key={s.id}>
                    <td>
                      <div>{s.display_name || s.email}</div>
                      {s.display_name ? <div className="text-muted small">{s.email}</div> : null}
                    </td>
                    <td>
                      <span
                        className={`badge ${s.role === 'manager' ? 'bg-warning text-dark' : 'bg-secondary'}`}
                      >
                        {ROLE_LABELS[s.role]}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {new Date(s.created_at).toLocaleString('ja-JP')}
                    </td>
                    <td>
                      <div
                        className="d-flex align-items-center justify-content-end gap-2"
                        title={isLastManager ? '最後の管理者は変更・削除できません' : undefined}
                      >
                        <select
                          className="form-select form-select-sm w-auto"
                          value={s.role}
                          disabled={disabled}
                          onChange={(e) => void onChangeRole(s, e.target.value as StaffRole)}
                        >
                          <option value="manager">{ROLE_LABELS.manager}</option>
                          <option value="viewer">{ROLE_LABELS.viewer}</option>
                        </select>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={disabled}
                          onClick={() => void onRemove(s)}
                        >
                          削除
                        </button>
                      </div>
                      {rowError[s.id] ? (
                        <div className="text-danger small mt-1 text-end">{rowError[s.id]}</div>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-3">
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={() => setShowInvite((v) => !v)}
        >
          <i className={`bi ${showInvite ? 'bi-chevron-up' : 'bi-person-plus'} me-1`} />
          {showInvite ? '招待フォームを閉じる' : 'スタッフを招待する'}
        </button>
        {showInvite ? (
          <div className="card card-body mt-2 border-0 bg-light">
            <StaffInviteForm eventId={eventId} onInvited={() => void reload()} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
