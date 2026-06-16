import { FormEvent, useEffect, useState } from 'react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAuthStore } from '@/features/auth/store/authStore'
import {
  createAdminBooth,
  deleteAdminBooth,
  updateAdminBooth,
  fetchAdminCategories,
  type AdminCategory,
} from '@/shared/api/v1Admin'
import { fetchV1Booths, type V1BoothListItem } from '@/shared/api/v1Participant'
import { formatClientError } from '@/shared/lib/formatClientError'

type BoothForm = { name: string; manualCode: string; description: string; categoryId: string; tags: string }
const EMPTY_FORM: BoothForm = { name: '', manualCode: '', description: '', categoryId: '', tags: '' }

function BoothFormFields({
  form,
  onChange,
  categories,
}: {
  form: BoothForm
  onChange: (f: BoothForm) => void
  categories: AdminCategory[]
}) {
  return (
    <div className="row g-2">
      <div className="col-md-3">
        <label className="form-label small fw-semibold">ブース名 *</label>
        <input className="form-control" placeholder="例: AIブース" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} />
      </div>
      <div className="col-md-2">
        <label className="form-label small fw-semibold">手動コード *</label>
        <input className="form-control" placeholder="例: AI001" maxLength={6} value={form.manualCode} onChange={(e) => onChange({ ...form, manualCode: e.target.value })} />
      </div>
      <div className="col-md-3">
        <label className="form-label small fw-semibold">説明</label>
        <input className="form-control" placeholder="任意" value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} />
      </div>
      <div className="col-md-2">
        <label className="form-label small fw-semibold">カテゴリ</label>
        <select className="form-select" value={form.categoryId} onChange={(e) => onChange({ ...form, categoryId: e.target.value })}>
          <option value="">なし</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="col-md-2">
        <label className="form-label small fw-semibold">タグ</label>
        <input className="form-control" placeholder="カンマ区切り" value={form.tags} onChange={(e) => onChange({ ...form, tags: e.target.value })} />
      </div>
    </div>
  )
}

export function BoothManagePage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const [booths, setBooths] = useState<V1BoothListItem[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [newForm, setNewForm] = useState<BoothForm>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<BoothForm>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function reload() {
    if (!eventId) return
    const [boothList, categoryList] = await Promise.all([fetchV1Booths(eventId), fetchAdminCategories(eventId)])
    setBooths(boothList)
    setCategories(categoryList)
  }

  useEffect(() => {
    reload().catch((e) => setError(formatClientError(e, 'ブース取得に失敗しました')))
  }, [eventId])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!eventId || !newForm.name.trim() || !newForm.manualCode.trim()) return
    try {
      await createAdminBooth(eventId, {
        name: newForm.name.trim(),
        manual_code: newForm.manualCode.trim(),
        description: newForm.description.trim() || undefined,
        category_id: newForm.categoryId || null,
        tags: newForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      })
      setNewForm(EMPTY_FORM)
      setShowForm(false)
      setError(null)
      await reload()
    } catch (err) {
      setError(formatClientError(err, '作成に失敗しました'))
    }
  }

  function startEdit(b: V1BoothListItem) {
    setEditId(b.id)
    setEditForm({
      name: b.name,
      manualCode: b.manual_code ?? '',
      description: b.description ?? '',
      categoryId: b.category?.id ?? '',
      tags: b.tags.join(', '),
    })
  }

  async function onSaveEdit(boothId: string) {
    if (!eventId || !editForm.name.trim()) return
    try {
      await updateAdminBooth(eventId, boothId, {
        name: editForm.name.trim(),
        manual_code: editForm.manualCode.trim(),
        description: editForm.description.trim() || undefined,
        category_id: editForm.categoryId || null,
        tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      })
      setEditId(null)
      setError(null)
      await reload()
    } catch (err) {
      setError(formatClientError(err, '更新に失敗しました'))
    }
  }

  async function onDelete(boothId: string) {
    if (!eventId || !confirm('このブースを削除しますか？')) return
    try {
      await deleteAdminBooth(eventId, boothId)
      await reload()
    } catch (err) {
      setError(formatClientError(err, '削除に失敗しました'))
    }
  }

  return (
    <AdminShell title="ブース管理">
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-exclamation-triangle-fill" />
          {error}
        </div>
      )}

      {/* 追加フォーム */}
      <div className="card border-0 shadow-sm mb-4">
        <div
          className="card-header bg-white d-flex justify-content-between align-items-center"
          style={{ cursor: 'pointer' }}
          onClick={() => setShowForm((v) => !v)}
        >
          <span className="fw-semibold">
            <i className="bi bi-plus-circle me-2 text-primary" />
            新しいブースを追加
          </span>
          <i className={`bi ${showForm ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted`} />
        </div>
        {showForm && (
          <div className="card-body">
            <form onSubmit={onCreate}>
              <BoothFormFields form={newForm} onChange={setNewForm} categories={categories} />
              <div className="mt-3 d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-check-lg me-1" />追加
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowForm(false); setNewForm(EMPTY_FORM) }}>
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ブース一覧 */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white fw-semibold">
          <i className="bi bi-shop me-2 text-success" />
          ブース一覧
          <span className="badge bg-secondary ms-2">{booths.length}</span>
        </div>
        {booths.length === 0 ? (
          <div className="card-body text-center text-muted py-5">
            <i className="bi bi-inbox fs-1 d-block mb-2" />
            ブースがまだありません
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {booths.map((b) =>
              editId === b.id ? (
                <div key={b.id} className="list-group-item p-3" style={{ backgroundColor: '#f0f7ff' }}>
                  <BoothFormFields form={editForm} onChange={setEditForm} categories={categories} />
                  <div className="mt-2 d-flex gap-2">
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => onSaveEdit(b.id)}>
                      <i className="bi bi-check-lg me-1" />保存
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditId(null)}>
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <div key={b.id} className="list-group-item d-flex align-items-center gap-3 p-3">
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="fw-semibold">{b.name}</span>
                      <code className="badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>
                        {b.manual_code}
                      </code>
                      {b.category && (
                        <span className="badge rounded-pill" style={{ backgroundColor: '#fd7e1422', color: '#fd7e14', fontSize: '0.72rem' }}>
                          {b.category.name}
                        </span>
                      )}
                      {b.tags.map((tag) => (
                        <span key={tag} className="badge bg-light text-muted border" style={{ fontSize: '0.7rem' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    {b.description && <div className="text-muted small mt-1">{b.description}</div>}
                  </div>
                  <div className="text-muted small text-center flex-shrink-0" style={{ minWidth: 56 }}>
                    <i className="bi bi-qr-code-scan d-block" />
                    {b.checkin_count}
                  </div>
                  <div className="d-flex gap-1 flex-shrink-0">
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => startEdit(b)}>
                      <i className="bi bi-pencil" />
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(b.id)}>
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
