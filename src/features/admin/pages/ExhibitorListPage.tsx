import axios from 'axios'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { RoleBadge } from '@/features/admin/components/RoleBadge'
import {
  deleteAdminExhibitorInvite,
  fetchAdminExhibitors,
  patchAdminUserRole,
  type AdminExhibitorInvite,
  type AdminExhibitorList,
  type AdminExhibitorMember,
} from '@/shared/api/v1Admin'
import { isManagerUser, useAuthStore } from '@/shared/auth/authStore'
import { formatClientError } from '@/shared/lib/formatClientError'

/**
 * 登録済み出展者の一覧。ブースごとにまとめ、ブース番号順に並べる。
 * まとめ方・並び順はサーバーの応答をそのまま使う（AGENTS.md 原則3）。
 * ロールの変更（出展者 → 参加者）と仮登録の取り消しは manager のみ。
 * 仮登録 = 運営がメアドとブースだけ登録し、本人がまだ参加者登録していない出展者。
 */
export function ExhibitorListPage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const canEdit = isManagerUser(useAuthStore((s) => s.user))
  const [data, setData] = useState<AdminExhibitorList | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  async function reload() {
    if (!eventId) return
    setData(await fetchAdminExhibitors(eventId))
  }

  useEffect(() => {
    reload().catch((e) => setError(formatClientError(e, '出展者一覧の取得に失敗しました')))
  }, [eventId])

  async function onDemote(member: AdminExhibitorMember) {
    if (
      !eventId ||
      !confirm(
        `${member.display_name ?? member.email} を参加者に戻します。担当ブースとの紐付けはすべて外れ、出展者画面に入れなくなります。よろしいですか？`,
      )
    ) {
      return
    }
    setBusyUserId(member.user_id)
    setError(null)
    try {
      await patchAdminUserRole(eventId, member.user_id, { role: 'participant' })
      await reload()
    } catch (e) {
      setError(formatClientError(e, 'ロールの変更に失敗しました'))
      // 409: 別の運営が先に変更していた。表示を最新に揃える
      if (axios.isAxiosError(e) && e.response?.status === 409) await reload().catch(() => {})
    } finally {
      setBusyUserId(null)
    }
  }

  async function onCancelInvite(invite: AdminExhibitorInvite) {
    if (!eventId || !confirm(`${invite.email}（${invite.booth_name}）の仮登録を取り消します。よろしいですか？`)) return
    setBusyUserId(`${invite.email}\0${invite.booth_id}`)
    setError(null)
    try {
      await deleteAdminExhibitorInvite(eventId, invite.email, invite.booth_id)
      await reload()
    } catch (e) {
      setError(formatClientError(e, '仮登録の取り消しに失敗しました'))
    } finally {
      setBusyUserId(null)
    }
  }

  const total = data
    ? new Set([...data.booths.flatMap((b) => b.exhibitors), ...data.unassigned].map((m) => m.user_id)).size
    : 0

  function renderMember(m: AdminExhibitorMember) {
    return (
      <div key={m.user_id} className="list-group-item d-flex align-items-center gap-3 px-3 py-2">
        <div className="flex-grow-1 min-w-0">
          <div className="fw-semibold">{m.display_name ?? '—'}</div>
          <div className="text-muted small text-truncate">{m.email}</div>
        </div>
        <RoleBadge role="exhibitor" />
        {canEdit ? (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary flex-shrink-0"
            disabled={busyUserId === m.user_id}
            onClick={() => onDemote(m)}
          >
            参加者に戻す
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <AdminShell title="出展者一覧">
      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" />
          {error}
        </div>
      ) : null}

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2 px-3 d-flex gap-4 align-items-center">
          <span className="small text-muted">
            <i className="bi bi-person-badge me-1" />
            出展者 <strong>{total}</strong> 人
          </span>
          <span className="small text-muted">
            <i className="bi bi-shop me-1" />
            ブース <strong>{data?.booths.length ?? 0}</strong> 件
          </span>
          {canEdit ? (
            <span className="small text-muted ms-auto">
              出展者の追加は <Link to="/admin/participants">参加者管理</Link> から
            </span>
          ) : null}
        </div>
      </div>

      {data && data.booths.length === 0 && data.unassigned.length === 0 && data.invites.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center text-muted py-5">
            <i className="bi bi-person-badge fs-1 d-block mb-2" />
            出展者がまだいません
          </div>
        </div>
      ) : null}

      {data?.booths.map((b) => (
        <div key={b.booth_id} className="card border-0 shadow-sm mb-3">
          <div className="card-header bg-white d-flex align-items-center gap-2">
            <span className="badge text-bg-dark">{b.display_code ?? '—'}</span>
            <span className="fw-bold">{b.booth_name}</span>
            <span className="text-muted small ms-auto">{b.exhibitors.length} 人</span>
          </div>
          <div className="list-group list-group-flush">
            {b.exhibitors.length ? (
              b.exhibitors.map(renderMember)
            ) : (
              <div className="list-group-item text-muted small">出展者が紐付いていません</div>
            )}
          </div>
        </div>
      ))}

      {data && data.unassigned.length > 0 ? (
        <div className="card border-warning mb-3">
          <div className="card-header bg-warning-subtle fw-bold">ブース未割り当て</div>
          <div className="list-group list-group-flush">{data.unassigned.map(renderMember)}</div>
        </div>
      ) : null}

      {data && data.invites.length > 0 ? (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-header bg-white">
            <span className="fw-bold">仮登録（本人未登録）</span>
            <span className="text-muted small ms-2">
              このメールアドレスで参加者登録すると、出展者になり担当ブースが紐付きます
            </span>
          </div>
          <div className="list-group list-group-flush">
            {data.invites.map((inv) => (
              <div
                key={`${inv.email}\0${inv.booth_id}`}
                className="list-group-item d-flex align-items-center gap-3 px-3 py-2"
              >
                <div className="flex-grow-1 min-w-0">
                  <div className="text-truncate">{inv.email}</div>
                  <div className="text-muted small">
                    <span className="badge text-bg-light me-1">{inv.display_code ?? '—'}</span>
                    {inv.booth_name}
                  </div>
                </div>
                {canEdit ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger flex-shrink-0"
                    disabled={busyUserId === `${inv.email}\0${inv.booth_id}`}
                    onClick={() => onCancelInvite(inv)}
                  >
                    取り消す
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </AdminShell>
  )
}
