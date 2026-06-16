import { useEffect, useState } from 'react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAuthStore } from '@/features/auth/store/authStore'
import { deleteAdminParticipant, fetchAdminParticipants, type AdminParticipant } from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'

export function ParticipantsPage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const [items, setItems] = useState<AdminParticipant[]>([])
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    if (!eventId) return
    setItems(await fetchAdminParticipants(eventId))
  }

  useEffect(() => {
    reload().catch((e) => setError(formatClientError(e, '参加者取得に失敗しました')))
  }, [eventId])

  async function onDelete(userId: string) {
    if (!eventId || !confirm('参加者を削除しますか？')) return
    try {
      await deleteAdminParticipant(eventId, userId)
      await reload()
    } catch (err) {
      setError(formatClientError(err, '削除に失敗しました'))
    }
  }

  return (
    <AdminShell title="参加者一覧">
      {error ? <p className="text-danger">{error}</p> : null}
      <div className="table-responsive">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>表示名</th>
              <th>メール</th>
              <th>チェックイン</th>
              <th>登録日時</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.display_name}</td>
                <td>{p.email}</td>
                <td>{p.checkin_count}</td>
                <td>{p.created_at}</td>
                <td>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(p.id)}>
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}
