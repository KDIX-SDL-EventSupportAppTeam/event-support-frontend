import { FormEvent, useEffect, useMemo, useState } from 'react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { isManagerUser, useAuthStore } from '@/shared/auth/authStore'
import {
  createAdminBooth,
  deleteAdminBooth,
  updateAdminBooth,
  regenerateBoothManualCode,
  fetchAdminBoothSummaries,
  fetchAdminCategories,
  type AdminCategory,
} from '@/shared/api/v1Admin'
import { fetchV1Booths, type V1BoothListItem } from '@/shared/api/v1Participant'
import { formatClientError } from '@/shared/lib/formatClientError'
import { CopyButton } from '@/shared/components/CopyButton'

/** 運営が編集できるブースの1行（display_code は公開、manual_code は秘匿・6桁数字） */
type BoothRow = V1BoothListItem & { manual_code: string; checkin_url: string }

type BoothForm = {
  name: string
  displayCode: string
  description: string
  categoryId: string
  tags: string
  /** 編集時のみ。新規作成ではサーバーが自動採番するので使わない */
  manualCode: string
}
const EMPTY_FORM: BoothForm = {
  name: '',
  displayCode: '',
  description: '',
  categoryId: '',
  tags: '',
  manualCode: '',
}

const MANUAL_CODE_RE = /^[0-9]{6}$/

function BoothFormFields({
  form,
  onChange,
  categories,
  showManualCode,
}: {
  form: BoothForm
  onChange: (f: BoothForm) => void
  categories: AdminCategory[]
  /** 編集フォームでのみ手動コード入力欄を出す（新規作成は自動採番） */
  showManualCode: boolean
}) {
  return (
    <div className="row g-2">
      <div className="col-md-3">
        <label className="form-label small fw-semibold">ブース名 *</label>
        <input
          className="form-control"
          placeholder="例: AIブース"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
        />
      </div>
      <div className="col-md-2">
        <label className="form-label small fw-semibold">
          ブース番号<span className="text-muted fw-normal">（公開・任意）</span>
        </label>
        <input
          className="form-control"
          placeholder="例: A-12"
          maxLength={16}
          value={form.displayCode}
          onChange={(e) => onChange({ ...form, displayCode: e.target.value })}
        />
      </div>
      {showManualCode ? (
        <div className="col-md-2">
          <label className="form-label small fw-semibold">
            手動コード<span className="text-muted fw-normal">（6桁数字・秘匿）</span>
          </label>
          <input
            className="form-control"
            placeholder="例: 481502"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={form.manualCode}
            onChange={(e) => onChange({ ...form, manualCode: e.target.value.replace(/[^0-9]/g, '') })}
          />
        </div>
      ) : null}
      <div className="col-md-2">
        <label className="form-label small fw-semibold">説明</label>
        <input
          className="form-control"
          placeholder="任意"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
      </div>
      <div className="col-md-2">
        <label className="form-label small fw-semibold">カテゴリ</label>
        <select
          className="form-select"
          value={form.categoryId}
          onChange={(e) => onChange({ ...form, categoryId: e.target.value })}
        >
          <option value="">なし</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-md-1">
        <label className="form-label small fw-semibold">タグ</label>
        <input
          className="form-control"
          placeholder="カンマ区切り"
          value={form.tags}
          onChange={(e) => onChange({ ...form, tags: e.target.value })}
        />
      </div>
    </div>
  )
}

export function BoothManagePage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  // manager と旧 admin のみ編集・削除・再発番を許可する
  const canEdit = isManagerUser(useAuthStore((s) => s.user))
  const [booths, setBooths] = useState<BoothRow[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [newForm, setNewForm] = useState<BoothForm>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<BoothForm>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function reload() {
    if (!eventId) return
    // 編集用メタデータ（説明・カテゴリ・タグ・display_code）は参加者向け一覧、
    // 秘匿の manual_code と掲示用 URL は運営向け一覧から取り、id で突き合わせる
    const [v1Booths, adminSummaries, categoryList] = await Promise.all([
      fetchV1Booths(eventId),
      fetchAdminBoothSummaries(eventId, { sort: 'name', order: 'asc' }),
      fetchAdminCategories(eventId),
    ])
    const byId = new Map(adminSummaries.map((s) => [s.id, s]))
    setBooths(
      v1Booths.map((b) => ({
        ...b,
        manual_code: byId.get(b.id)?.manual_code ?? '',
        checkin_url: byId.get(b.id)?.checkin_url ?? '',
      })),
    )
    setCategories(categoryList)
  }

  useEffect(() => {
    reload().catch((e) => setError(formatClientError(e, 'ブース取得に失敗しました')))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!eventId || !newForm.name.trim()) return
    try {
      // 手動コードは送らない（サーバーが6桁数字を自動採番し、作成後に一覧へ出る）
      await createAdminBooth(eventId, {
        name: newForm.name.trim(),
        display_code: newForm.displayCode.trim() || null,
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

  function startEdit(b: BoothRow) {
    setEditId(b.id)
    setEditForm({
      name: b.name,
      displayCode: b.display_code ?? '',
      description: b.description ?? '',
      categoryId: b.category?.id ?? '',
      tags: b.tags.join(', '),
      manualCode: b.manual_code ?? '',
    })
  }

  async function onSaveEdit(boothId: string) {
    if (!eventId || !editForm.name.trim()) return
    const manual = editForm.manualCode.trim()
    if (manual && !MANUAL_CODE_RE.test(manual)) {
      setError('手動コードは6桁の数字で入力してください')
      return
    }
    try {
      await updateAdminBooth(eventId, boothId, {
        name: editForm.name.trim(),
        display_code: editForm.displayCode.trim() || null,
        description: editForm.description.trim() || undefined,
        category_id: editForm.categoryId || null,
        tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        // 変更があったときだけ送る（未変更なら再発番されない）
        ...(manual && manual !== '' ? { manual_code: manual } : {}),
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

  async function onRegenerate(booth: BoothRow) {
    if (!eventId) return
    if (
      !confirm(
        `「${booth.name}」の手動コードを再発番します。\n掲示物・ポスターの刷り直しが必要になります。よろしいですか？`,
      )
    )
      return
    try {
      await regenerateBoothManualCode(eventId, booth.id)
      setError(null)
      await reload()
    } catch (err) {
      setError(formatClientError(err, '再発番に失敗しました'))
    }
  }

  /** 掲示物担当へ渡す用の書き出しテキスト（TSV。ブース名・番号・手動コード・URL） */
  const exportText = useMemo(() => {
    const header = ['ブース名', 'ブース番号', '手動コード', 'チェックインURL'].join('\t')
    const lines = booths.map((b) =>
      [b.name, b.display_code ?? '', b.manual_code, b.checkin_url].join('\t'),
    )
    return [header, ...lines].join('\n')
  }, [booths])

  return (
    <AdminShell title="ブース管理">
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-exclamation-triangle-fill" />
          {error}
        </div>
      )}

      {/* 追加フォーム（管理者のみ表示） */}
      {canEdit && (
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
                <BoothFormFields
                  form={newForm}
                  onChange={setNewForm}
                  categories={categories}
                  showManualCode={false}
                />
                <p className="text-muted small mt-2 mb-0">
                  手動コード（6桁数字）は作成時にサーバーが自動採番します。作成後、一覧に表示されます。
                </p>
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
                      setNewForm(EMPTY_FORM)
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

      {/* ブース一覧 */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span className="fw-semibold">
            <i className="bi bi-shop me-2 text-success" />
            ブース一覧
            <span className="badge bg-secondary ms-2">{booths.length}</span>
          </span>
          {booths.length > 0 ? (
            <CopyButton text={exportText} label="一覧をコピー（掲示物作成用）" />
          ) : null}
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
                  <BoothFormFields
                    form={editForm}
                    onChange={setEditForm}
                    categories={categories}
                    showManualCode
                  />
                  <div className="mt-2 d-flex gap-2">
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => onSaveEdit(b.id)}>
                      <i className="bi bi-check-lg me-1" />
                      保存
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setEditId(null)}
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <div key={b.id} className="list-group-item p-3">
                  <div className="d-flex align-items-start gap-3">
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="fw-semibold">{b.name}</span>
                        <span
                          className="badge bg-light text-dark border"
                          style={{ fontSize: '0.75rem' }}
                          title="ブース番号（公開）"
                        >
                          番号: {b.display_code || '—'}
                        </span>
                        <code
                          className="badge bg-light text-dark border"
                          style={{ fontSize: '0.75rem' }}
                          title="手動コード（秘匿・6桁数字）"
                        >
                          手動: {b.manual_code || '—'}
                        </code>
                        {b.category && (
                          <span
                            className="badge rounded-pill"
                            style={{ backgroundColor: '#fd7e1422', color: '#fd7e14', fontSize: '0.72rem' }}
                          >
                            {b.category.name}
                          </span>
                        )}
                        {b.tags.map((tag) => (
                          <span
                            key={tag}
                            className="badge bg-light text-muted border"
                            style={{ fontSize: '0.7rem' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {b.description && <div className="text-muted small mt-1">{b.description}</div>}
                      {b.checkin_url ? (
                        <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
                          <span
                            className="text-muted small text-truncate"
                            style={{ maxWidth: 320 }}
                            title={b.checkin_url}
                          >
                            {b.checkin_url}
                          </span>
                          <CopyButton text={b.checkin_url} label="URLをコピー" />
                        </div>
                      ) : null}
                    </div>
                    <div
                      className="text-muted small text-center flex-shrink-0"
                      style={{ minWidth: 56 }}
                    >
                      <i className="bi bi-qr-code-scan d-block" />
                      {b.checkin_count}
                    </div>
                    {canEdit && (
                      <div className="d-flex gap-1 flex-shrink-0 flex-wrap justify-content-end" style={{ maxWidth: 200 }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => startEdit(b)}
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => void onRegenerate(b)}
                          title="手動コードを再発番する"
                        >
                          <i className="bi bi-arrow-repeat me-1" />
                          再発番
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDelete(b.id)}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
