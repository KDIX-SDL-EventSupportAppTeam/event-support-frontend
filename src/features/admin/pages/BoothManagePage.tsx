import { FormEvent, useEffect, useState } from 'react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAuthStore } from '@/features/auth/store/authStore'
import {
  createAdminBooth,
  deleteAdminBooth,
  fetchAdminCategories,
  type AdminCategory,
} from '@/shared/api/v1Admin'
import { fetchV1Booths, type V1BoothListItem } from '@/shared/api/v1Participant'
import { formatClientError } from '@/shared/lib/formatClientError'

export function BoothManagePage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const [booths, setBooths] = useState<V1BoothListItem[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [name, setName] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    if (!eventId) return
    const [boothList, categoryList] = await Promise.all([
      fetchV1Booths(eventId),
      fetchAdminCategories(eventId),
    ])
    setBooths(boothList)
    setCategories(categoryList)
  }

  useEffect(() => {
    reload().catch((e) => setError(formatClientError(e, 'ブース取得に失敗しました')))
  }, [eventId])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!eventId || !name.trim() || !manualCode.trim()) return
    try {
      await createAdminBooth(eventId, {
        name: name.trim(),
        manual_code: manualCode.trim(),
        description: description.trim() || undefined,
        category_id: categoryId || null,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      })
      setName('')
      setManualCode('')
      setDescription('')
      setCategoryId('')
      setTags('')
      await reload()
    } catch (err) {
      setError(formatClientError(err, '作成に失敗しました'))
    }
  }

  async function onDelete(boothId: string) {
    if (!eventId || !confirm('削除しますか？')) return
    try {
      await deleteAdminBooth(eventId, boothId)
      await reload()
    } catch (err) {
      setError(formatClientError(err, '削除に失敗しました'))
    }
  }

  return (
    <AdminShell title="ブース管理">
      {error ? <p className="text-danger">{error}</p> : null}
      <form className="row g-2 mb-4" onSubmit={onCreate}>
        <div className="col-md-3">
          <input className="form-control" placeholder="ブース名" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="col-md-2">
          <input
            className="form-control"
            placeholder="手動コード"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="説明"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">カテゴリなし</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <input
            className="form-control"
            placeholder="タグ(カンマ区切り)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <div className="col-12">
          <button type="submit" className="btn btn-primary">
            ブース追加
          </button>
        </div>
      </form>
      <div className="table-responsive">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>名前</th>
              <th>コード</th>
              <th>カテゴリ</th>
              <th>チェックイン</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {booths.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.manual_code}</td>
                <td>{b.category?.name ?? '—'}</td>
                <td>{b.checkin_count}</td>
                <td>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(b.id)}>
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
