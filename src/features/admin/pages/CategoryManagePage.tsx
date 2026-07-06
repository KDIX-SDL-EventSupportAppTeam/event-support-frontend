import { FormEvent, useEffect, useState } from 'react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { isManagerUser, useAuthStore } from '@/shared/auth/authStore'
import {
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
  updateAdminCategory,
  type AdminCategory,
} from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'

export function CategoryManagePage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const canEdit = isManagerUser(useAuthStore((s) => s.user))
  const [items, setItems] = useState<AdminCategory[]>([])
  const [name, setName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    if (!eventId) return
    setItems(await fetchAdminCategories(eventId))
  }

  useEffect(() => {
    reload().catch((e) => setError(formatClientError(e, 'カテゴリ取得に失敗しました')))
  }, [eventId])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!eventId || !name.trim()) return
    try {
      await createAdminCategory(eventId, { name: name.trim() })
      setName('')
      await reload()
    } catch (err) {
      setError(formatClientError(err, '作成に失敗しました'))
    }
  }

  async function onSaveEdit(id: string) {
    if (!eventId || !editName.trim()) return
    try {
      await updateAdminCategory(eventId, id, { name: editName.trim() })
      setEditId(null)
      await reload()
    } catch (err) {
      setError(formatClientError(err, '更新に失敗しました'))
    }
  }

  async function onDelete(id: string) {
    if (!eventId || !confirm('削除しますか？')) return
    try {
      await deleteAdminCategory(eventId, id)
      await reload()
    } catch (err) {
      setError(formatClientError(err, '削除に失敗しました'))
    }
  }

  return (
    <AdminShell title="カテゴリ管理">
      {error ? <p className="text-danger">{error}</p> : null}
      {canEdit && <form className="row g-2 mb-4" onSubmit={onCreate}>
        <div className="col-md-8">
          <input
            className="form-control"
            placeholder="カテゴリ名"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <button type="submit" className="btn btn-primary">
            追加
          </button>
        </div>
      </form>}
      <ul className="list-group">
        {items.map((item) => (
          <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center gap-2">
            {editId === item.id ? (
              <>
                <input
                  className="form-control form-control-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <button type="button" className="btn btn-sm btn-primary" onClick={() => onSaveEdit(item.id)}>
                  保存
                </button>
              </>
            ) : (
              <>
                <span>{item.name}</span>
                {canEdit && (
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setEditId(item.id)
                        setEditName(item.name)
                      }}
                    >
                      編集
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(item.id)}>
                      削除
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </AdminShell>
  )
}
