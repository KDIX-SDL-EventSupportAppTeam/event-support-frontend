import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { isManagerUser, useAuthStore } from '@/shared/auth/authStore'
import { BOOTH_BULK_TEMPLATE } from '@/features/admin/lib/boothBulkTemplate'
import {
  emptyBoothBulkRow,
  submittableBoothBulkRows,
  validateBoothBulkRows,
  type BoothBulkRow,
} from '@/features/admin/lib/validateBoothBulkRows'
import {
  createAdminBooth,
  createAdminCategory,
  fetchAdminCategories,
  type AdminCategory,
} from '@/shared/api/v1Admin'
import { boothIconSrc } from '@/shared/lib/boothIcon'
import { boothImageSrc } from '@/shared/lib/boothImage'
import { formatClientError } from '@/shared/lib/formatClientError'

let rowKeySeq = 0
function nextRowKey(): string {
  rowKeySeq += 1
  return `row-${rowKeySeq}`
}

type RowResult = { status: 'created' | 'error'; message?: string }

/**
 * ブース一括登録（スプレッド風テーブル）。
 *
 * - 「ジャンル」は既存のカテゴリ機能をそのまま使う。未登録の名前を入力した行があれば、
 *   送信時にカテゴリを自動作成してから紐付ける（バックエンドにジャンル専用フィールドは無い）
 * - 「ブースアイコン画像」「ブースイメージ画像」はサーバーには保存しない。どちらも番号で引く
 *   既存方式のまま（`boothIcon.ts` / `boothImage.ts`、docs/reference/assets.md「booth」）。
 *   ここでは番号を入れた時点で両方をその場でプレビューするだけ
 * - ブース一括作成 API は無いため、1行ずつ `createAdminBooth` を順番に呼ぶ（重複カテゴリ作成を避けるため直列）
 */
export function BoothBulkRegisterPage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const isManager = isManagerUser(useAuthStore((s) => s.user))

  const [rows, setRows] = useState<BoothBulkRow[]>(() => [emptyBoothBulkRow(nextRowKey())])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<Map<string, RowResult>>(new Map())
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    fetchAdminCategories(eventId)
      .then(setCategories)
      .catch((e) => setCategoriesError(formatClientError(e, 'カテゴリ一覧の取得に失敗しました')))
  }, [eventId])

  if (!isManager) {
    return (
      <AdminShell title="ブース一括登録">
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" />
          運営管理者権限が必要です
        </div>
      </AdminShell>
    )
  }

  const validated = useMemo(() => validateBoothBulkRows(rows), [rows])
  const submittable = useMemo(() => submittableBoothBulkRows(validated), [validated])
  const errorRowCount = validated.filter((r) => !r.isBlank && r.errors.length > 0).length

  function updateRow(key: string, patch: Partial<BoothBulkRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)))
  }

  function addRow() {
    setRows((prev) => [...prev, emptyBoothBulkRow(nextRowKey())])
  }

  function loadTemplate() {
    const hasInput = rows.some(
      (r) => r.displayCode.trim() || r.name.trim() || r.genre.trim() || r.description.trim() || r.tags.trim(),
    )
    if (hasInput && !confirm('入力済みの内容を破棄してテンプレート（39件）を読み込みます。よろしいですか？')) {
      return
    }
    setResults(new Map())
    setSubmitError(null)
    setRows(
      BOOTH_BULK_TEMPLATE.map((t) => ({
        key: nextRowKey(),
        displayCode: t.displayCode,
        name: t.name,
        genre: '',
        description: t.description,
        tags: '',
      })),
    )
  }

  async function resolveCategoryId(genre: string, cache: Map<string, AdminCategory>): Promise<string | null> {
    const trimmed = genre.trim()
    if (!trimmed) return null
    const cacheKey = trimmed.toLowerCase()
    const cached = cache.get(cacheKey)
    if (cached) return cached.id
    if (!eventId) return null
    const created = await createAdminCategory(eventId, { name: trimmed })
    cache.set(cacheKey, created)
    return created.id
  }

  async function onSubmit() {
    if (!eventId || submittable.length === 0) return
    setSubmitting(true)
    setSubmitError(null)
    const nextResults = new Map<string, RowResult>()
    // 既存カテゴリを名前（大文字小文字を無視）で引けるようにしておく。表内で同じジャンルが
    // 複数行にあっても、カテゴリ作成 API を1回しか呼ばないようにするため
    const categoryCache = new Map<string, AdminCategory>(categories.map((c) => [c.name.toLowerCase(), c]))

    for (const row of submittable) {
      try {
        const categoryId = await resolveCategoryId(row.genre, categoryCache)
        await createAdminBooth(eventId, {
          name: row.name.trim(),
          display_code: row.displayCode.trim() || null,
          description: row.description.trim() || undefined,
          category_id: categoryId,
          tags: row.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        })
        nextResults.set(row.key, { status: 'created' })
      } catch (e) {
        nextResults.set(row.key, { status: 'error', message: formatClientError(e, '作成に失敗しました') })
      }
      // 結果を1行ずつ反映して進捗が見えるようにする
      setResults(new Map(nextResults))
    }

    setCategories((prev) => {
      const byId = new Map(prev.map((c) => [c.id, c]))
      for (const c of categoryCache.values()) byId.set(c.id, c)
      return [...byId.values()]
    })

    const failedCount = [...nextResults.values()].filter((r) => r.status === 'error').length
    if (failedCount > 0) {
      setSubmitError(`${failedCount} 件の作成に失敗しました。行ごとの理由は表の右端を確認してください。`)
    }
    setSubmitting(false)
  }

  return (
    <AdminShell title="ブース一括登録">
      <p className="text-muted small">
        表に直接入力し、「一括作成」で全行まとめてブースを作成します。「テンプレートを読み込む」で
        今回のイベント用の39ブース分（番号・ブース名・紹介文）を一気に流し込めます。ジャンルは空欄なら
        カテゴリなしのまま作成されます。ブース画像（アイコン・イメージとも）は登録不要です。
        番号を入れると、一覧・ビンゴ盤で使う「アイコン」とブース詳細モーダルで使う
        「イメージ」が両方その場でプレビューされます。
      </p>
      <p className="text-muted small">
        <code>public/booth/booth-&lt;番号&gt;.png</code>（アイコン）／
        <code>public/booth/image/booth-&lt;番号&gt;.png</code>（イメージ）の既存素材から自動で引きます。
      </p>

      {categoriesError ? (
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" />
          {categoriesError}
        </div>
      ) : null}

      <div className="d-flex gap-2 flex-wrap mb-3">
        <button type="button" className="btn btn-outline-primary" onClick={loadTemplate}>
          <i className="bi bi-magic me-1" />
          テンプレートを読み込む（39件）
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={addRow}>
          <i className="bi bi-plus-lg me-1" />
          行を追加
        </button>
        <Link to="/admin/categories" className="btn btn-outline-secondary">
          <i className="bi bi-tags me-1" />
          カテゴリ管理を開く
        </Link>
      </div>

      <div className="table-responsive mb-3">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th style={{ width: 72 }}>番号</th>
              <th style={{ width: 56 }}>アイコン</th>
              <th style={{ width: 56 }}>イメージ</th>
              <th style={{ minWidth: 160 }}>ブース名 *</th>
              <th style={{ minWidth: 140 }}>ジャンル</th>
              <th style={{ minWidth: 200 }}>説明</th>
              <th style={{ minWidth: 140 }}>タグ（カンマ区切り）</th>
              <th style={{ minWidth: 140 }}>状態</th>
              <th style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {validated.map((row) => {
              const iconSrc = boothIconSrc(row.displayCode)
              const imageSrc = boothImageSrc(row.displayCode)
              const result = results.get(row.key)
              return (
                <tr key={row.key} className={row.errors.length > 0 ? 'table-danger' : undefined}>
                  <td>
                    <input
                      className="form-control form-control-sm"
                      value={row.displayCode}
                      onChange={(e) => updateRow(row.key, { displayCode: e.target.value })}
                    />
                  </td>
                  <td className="text-center">
                    {iconSrc ? (
                      <img
                        src={iconSrc}
                        alt=""
                        style={{ width: 36, height: 36, objectFit: 'contain' }}
                      />
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </td>
                  <td className="text-center">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt=""
                        style={{ width: 36, height: 36, objectFit: 'cover' }}
                      />
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </td>
                  <td>
                    <input
                      className="form-control form-control-sm"
                      value={row.name}
                      onChange={(e) => updateRow(row.key, { name: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="form-control form-control-sm"
                      list="booth-bulk-genre-options"
                      value={row.genre}
                      onChange={(e) => updateRow(row.key, { genre: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="form-control form-control-sm"
                      value={row.description}
                      onChange={(e) => updateRow(row.key, { description: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="form-control form-control-sm"
                      value={row.tags}
                      onChange={(e) => updateRow(row.key, { tags: e.target.value })}
                    />
                  </td>
                  <td className="small">
                    {row.errors.length > 0 ? (
                      <span className="text-danger">{row.errors.join('、')}</span>
                    ) : result?.status === 'created' ? (
                      <span className="text-success">
                        <i className="bi bi-check-circle-fill me-1" />
                        作成済み
                      </span>
                    ) : result?.status === 'error' ? (
                      <span className="text-danger">{result.message}</span>
                    ) : null}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      disabled={rows.length <= 1}
                      onClick={() => removeRow(row.key)}
                      aria-label="この行を削除"
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <datalist id="booth-bulk-genre-options">
          {categories.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
      </div>

      {submitError ? (
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" />
          {submitError}
        </div>
      ) : null}

      <div className="d-flex align-items-center gap-3">
        <button
          type="button"
          className="btn btn-primary"
          disabled={submittable.length === 0 || errorRowCount > 0 || submitting}
          onClick={onSubmit}
        >
          {submitting ? '作成中…' : `一括作成（${submittable.length}件）`}
        </button>
        <Link to="/admin/booths" className="btn btn-outline-secondary">
          ブース管理へ戻る
        </Link>
      </div>
    </AdminShell>
  )
}
