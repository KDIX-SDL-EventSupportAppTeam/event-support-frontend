import { FormEvent, useCallback, useEffect, useState } from 'react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { isManagerUser, useAuthStore } from '@/shared/auth/authStore'
import {
  fetchAdminAwards,
  createAdminAward,
  updateAdminAward,
  deleteAdminAward,
  patchAdminAwardVoting,
  fetchAdminAwardTally,
  type AdminAward,
  type AdminAwardTally,
} from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'

type AwardForm = { name: string; description: string; color: string; sortOrder: string }
const EMPTY: AwardForm = { name: '', description: '', color: 'pink', sortOrder: '0' }

export function AdminAwardsPage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const canManage = isManagerUser(useAuthStore((s) => s.user))

  const [awards, setAwards] = useState<AdminAward[]>([])
  const [votingOpen, setVotingOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newForm, setNewForm] = useState<AwardForm>(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<AwardForm>(EMPTY)
  const [tallyFor, setTallyFor] = useState<string | null>(null)
  const [tally, setTally] = useState<AdminAwardTally | null>(null)
  const [tallyError, setTallyError] = useState<string | null>(null)
  const [togglingVoting, setTogglingVoting] = useState(false)

  const reload = useCallback(async () => {
    if (!eventId) return
    const res = await fetchAdminAwards(eventId)
    setAwards(res.awards)
    setVotingOpen(res.voting_open)
  }, [eventId])

  useEffect(() => {
    reload().catch((e) => setError(formatClientError(e, 'アワードの取得に失敗しました')))
  }, [reload])

  async function onToggleVoting() {
    if (!eventId) return
    const next = !votingOpen
    if (!confirm(next ? '投票を開始します。よろしいですか？' : '投票を締め切ります。よろしいですか？')) return
    setTogglingVoting(true)
    setError(null)
    try {
      const res = await patchAdminAwardVoting(eventId, next)
      setVotingOpen(res.is_open)
    } catch (e) {
      setError(formatClientError(e, '開閉の切り替えに失敗しました'))
    } finally {
      setTogglingVoting(false)
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!eventId || !newForm.name.trim()) return
    try {
      await createAdminAward(eventId, {
        name: newForm.name.trim(),
        description: newForm.description.trim() || undefined,
        color: newForm.color.trim() || undefined,
        sort_order: Number(newForm.sortOrder) || 0,
      })
      setNewForm(EMPTY)
      setShowForm(false)
      setError(null)
      await reload()
    } catch (err) {
      setError(formatClientError(err, '追加に失敗しました'))
    }
  }

  async function onSaveEdit(id: string) {
    if (!eventId || !editForm.name.trim()) return
    try {
      await updateAdminAward(eventId, id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        color: editForm.color.trim() || undefined,
        sort_order: Number(editForm.sortOrder) || 0,
      })
      setEditId(null)
      setError(null)
      await reload()
    } catch (err) {
      setError(formatClientError(err, '更新に失敗しました'))
    }
  }

  async function onDelete(a: AdminAward) {
    if (!eventId) return
    if (!confirm(`「${a.name}」を削除します。この賞への投票 ${a.vote_count} 件も一緒に消えます。よろしいですか？`)) return
    try {
      await deleteAdminAward(eventId, a.id)
      if (tallyFor === a.id) {
        setTallyFor(null)
        setTally(null)
      }
      await reload()
    } catch (err) {
      setError(formatClientError(err, '削除に失敗しました'))
    }
  }

  async function openTally(id: string) {
    if (!eventId) return
    if (tallyFor === id) {
      setTallyFor(null)
      setTally(null)
      return
    }
    setTallyFor(id)
    setTally(null)
    setTallyError(null)
    try {
      setTally(await fetchAdminAwardTally(eventId, id))
    } catch (e) {
      setTallyError(formatClientError(e, '集計の取得に失敗しました'))
    }
  }

  return (
    <AdminShell title="アワード">
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-exclamation-triangle-fill" />
          {error}
        </div>
      )}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body d-flex align-items-center justify-content-between flex-wrap gap-2">
          <span className="fw-semibold">
            投票の状態:{' '}
            <span className={`badge ${votingOpen ? 'bg-success' : 'bg-secondary'}`}>
              {votingOpen ? '受付中' : '停止中'}
            </span>
          </span>
          {canManage ? (
            <button
              type="button"
              className={`btn btn-sm ${votingOpen ? 'btn-outline-danger' : 'btn-success'}`}
              onClick={() => void onToggleVoting()}
              disabled={togglingVoting}
            >
              {votingOpen ? '投票を締め切る' : '投票を開始する'}
            </button>
          ) : null}
        </div>
      </div>

      {canManage && (
        <div className="card border-0 shadow-sm mb-4">
          <div
            className="card-header bg-white d-flex justify-content-between align-items-center"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowForm((v) => !v)}
          >
            <span className="fw-semibold">
              <i className="bi bi-plus-circle me-2 text-primary" />
              賞を追加
            </span>
            <i className={`bi ${showForm ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted`} />
          </div>
          {showForm && (
            <div className="card-body">
              <form onSubmit={onCreate}>
                <AwardFormFields form={newForm} onChange={setNewForm} />
                <div className="mt-3 d-flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-lg me-1" />
                    追加
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setShowForm(false)
                      setNewForm(EMPTY)
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white fw-semibold">
          <i className="bi bi-award me-2 text-success" />
          賞一覧
          <span className="badge bg-secondary ms-2">{awards.length}</span>
        </div>
        {awards.length === 0 ? (
          <div className="card-body text-center text-muted py-5">賞がまだありません</div>
        ) : (
          <div className="list-group list-group-flush">
            {awards.map((a) =>
              editId === a.id ? (
                <div key={a.id} className="list-group-item p-3" style={{ backgroundColor: '#f0f7ff' }}>
                  <AwardFormFields form={editForm} onChange={setEditForm} />
                  <div className="mt-2 d-flex gap-2">
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => onSaveEdit(a.id)}>
                      保存
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditId(null)}>
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <div key={a.id} className="list-group-item p-3">
                  <div className="d-flex align-items-start gap-3">
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold">
                        {a.name}
                        <span className="badge bg-light text-dark border ms-2">{a.vote_count} 票</span>
                      </div>
                      {a.description && <div className="text-muted small mt-1">{a.description}</div>}
                    </div>
                    <div className="d-flex gap-1 flex-shrink-0 flex-wrap justify-content-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => void openTally(a.id)}
                      >
                        {tallyFor === a.id ? '集計を閉じる' : 'ブース別票数'}
                      </button>
                      {canManage && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setEditId(a.id)
                              setEditForm({
                                name: a.name,
                                description: a.description,
                                color: a.color,
                                sortOrder: String(a.sort_order),
                              })
                            }}
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => void onDelete(a)}
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {tallyFor === a.id ? (
                    <div className="mt-3 border-top pt-3">
                      {tallyError ? (
                        <p className="text-danger small mb-0">{tallyError}</p>
                      ) : !tally ? (
                        <p className="text-muted small mb-0">読み込み中…</p>
                      ) : tally.booths.length === 0 ? (
                        <p className="text-muted small mb-0">まだ投票がありません</p>
                      ) : (
                        <div className="d-flex flex-column gap-1">
                          <div className="text-muted small mb-1">合計 {tally.total_votes} 票</div>
                          {tally.booths.map((b) => (
                            <div key={b.booth_id} className="d-flex justify-content-between small">
                              <span className="text-truncate" style={{ maxWidth: '70%' }}>
                                {b.booth_name}
                              </span>
                              <span className="fw-semibold">{b.votes}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </AdminShell>
  )
}

function AwardFormFields({ form, onChange }: { form: AwardForm; onChange: (f: AwardForm) => void }) {
  return (
    <div className="row g-2">
      <div className="col-md-4">
        <label className="form-label small fw-semibold">賞の名前 *</label>
        <input
          className="form-control"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="例: ベストブース賞"
        />
      </div>
      <div className="col-md-4">
        <label className="form-label small fw-semibold">説明</label>
        <input
          className="form-control"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="任意"
        />
      </div>
      <div className="col-md-2">
        <label className="form-label small fw-semibold">色</label>
        <select
          className="form-select"
          value={form.color}
          onChange={(e) => onChange({ ...form, color: e.target.value })}
        >
          {['pink', 'purple', 'green', 'yellow', 'orange', 'cyan', 'deep-pink', 'gray'].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="col-md-2">
        <label className="form-label small fw-semibold">表示順</label>
        <input
          className="form-control"
          type="number"
          min={0}
          value={form.sortOrder}
          onChange={(e) => onChange({ ...form, sortOrder: e.target.value })}
        />
      </div>
    </div>
  )
}
