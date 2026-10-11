import { useEffect, useMemo, useState } from 'react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import {
  AWARD_COLORS,
  MASTER_AWARD_TEMPLATE,
  MASTER_CATEGORY_TEMPLATE,
  planCreations,
  type MasterAwardRow,
} from '@/features/admin/lib/masterDataPreset'
import {
  createAdminAward,
  createAdminCategory,
  fetchAdminAwards,
  fetchAdminCategories,
  type AdminAward,
  type AdminCategory,
} from '@/shared/api/v1Admin'
import { isManagerUser, useAuthStore } from '@/shared/auth/authStore'
import { formatClientError } from '@/shared/lib/formatClientError'

type CategoryRow = { key: string; name: string }
type AwardRow = MasterAwardRow & { key: string }

let rowSeq = 0
const nextKey = () => `row-${++rowSeq}`
const emptyAward = (): AwardRow => ({ key: nextKey(), name: '', description: '', color: 'pink' })

/**
 * カテゴリ・アワード一括登録（開発者ツール）。
 * 推薦システムが使うカテゴリと、本番で実施する事前決定済みのアワードをまとめて作る。
 * 一括作成 API は無いため 1 件ずつ順番に作成する。名前が既存と一致する行はスキップするので、
 * 何度押しても二重登録しない。
 */
export function MasterDataBulkPage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const isManager = isManagerUser(useAuthStore((s) => s.user))

  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [awards, setAwards] = useState<AdminAward[]>([])
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([{ key: nextKey(), name: '' }])
  const [awardRows, setAwardRows] = useState<AwardRow[]>([emptyAward()])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    if (!eventId) return
    const [cats, aw] = await Promise.all([fetchAdminCategories(eventId), fetchAdminAwards(eventId)])
    setCategories(cats)
    setAwards(aw.awards)
  }

  useEffect(() => {
    reload().catch((e) => setError(formatClientError(e, '読み込みに失敗しました')))
  }, [eventId])

  const categoryPlan = useMemo(
    () => planCreations(categoryRows, categories.map((c) => c.name)),
    [categoryRows, categories],
  )
  const awardPlan = useMemo(() => planCreations(awardRows, awards.map((a) => a.name)), [awardRows, awards])

  async function onSubmit() {
    if (!eventId || busy) return
    const total = categoryPlan.toCreate.length + awardPlan.toCreate.length
    if (total === 0) return
    if (
      !confirm(
        `カテゴリ ${categoryPlan.toCreate.length} 件・アワード ${awardPlan.toCreate.length} 件を本番データとして作成します。よろしいですか？`,
      )
    ) {
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    let createdCategories = 0
    let createdAwards = 0
    try {
      for (const row of categoryPlan.toCreate) {
        await createAdminCategory(eventId, { name: row.name })
        createdCategories++
      }
      const baseOrder = awards.reduce((max, a) => Math.max(max, a.sort_order), 0)
      for (const [i, row] of awardPlan.toCreate.entries()) {
        await createAdminAward(eventId, {
          name: row.name,
          description: row.description.trim() || undefined,
          color: row.color,
          sort_order: baseOrder + i + 1,
        })
        createdAwards++
      }
      setMessage(`カテゴリ ${createdCategories} 件・アワード ${createdAwards} 件を作成しました`)
      setCategoryRows([{ key: nextKey(), name: '' }])
      setAwardRows([emptyAward()])
    } catch (e) {
      setError(
        `${formatClientError(e, '作成に失敗しました')}（作成済み: カテゴリ ${createdCategories} 件・アワード ${createdAwards} 件）`,
      )
    } finally {
      await reload().catch(() => {})
      setBusy(false)
    }
  }

  if (!isManager) {
    return (
      <AdminShell title="カテゴリ・アワード一括登録" devTool>
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" />
          運営管理者権限が必要です
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell title="カテゴリ・アワード一括登録" devTool>
      {error ? <div className="alert alert-danger">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}

      <div className="row g-4">
        <section className="col-lg-5">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h2 className="h6 fw-bold mb-0">
                  <i className="bi bi-tags me-1" />
                  カテゴリ（推薦に使用）
                </h2>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setCategoryRows(MASTER_CATEGORY_TEMPLATE.map((name) => ({ key: nextKey(), name })))}
                >
                  テンプレートを読み込む
                </button>
              </div>
              <p className="small text-muted">
                登録済み: {categories.length ? categories.map((c) => c.name).join('、') : 'なし'}
              </p>
              {categoryRows.map((row) => {
                const dup = categoryPlan.skipped.includes(row)
                return (
                  <div key={row.key} className="input-group input-group-sm mb-2">
                    <input
                      className={`form-control ${dup ? 'is-warning border-warning' : ''}`}
                      value={row.name}
                      placeholder="カテゴリ名"
                      onChange={(e) =>
                        setCategoryRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, name: e.target.value } : r)))
                      }
                    />
                    {dup ? <span className="input-group-text text-warning">登録済み</span> : null}
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      aria-label="行を削除"
                      onClick={() => setCategoryRows((prev) => prev.filter((r) => r.key !== row.key))}
                    >
                      <i className="bi bi-x" />
                    </button>
                  </div>
                )
              })}
              <button
                type="button"
                className="btn btn-sm btn-link px-0"
                onClick={() => setCategoryRows((prev) => [...prev, { key: nextKey(), name: '' }])}
              >
                <i className="bi bi-plus" /> 行を追加
              </button>
            </div>
          </div>
        </section>

        <section className="col-lg-7">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h2 className="h6 fw-bold mb-0">
                  <i className="bi bi-award me-1" />
                  アワード（本番で実施する賞）
                </h2>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={MASTER_AWARD_TEMPLATE.length === 0}
                  title={MASTER_AWARD_TEMPLATE.length === 0 ? 'テンプレートが未設定です' : undefined}
                  onClick={() => setAwardRows(MASTER_AWARD_TEMPLATE.map((a) => ({ ...a, key: nextKey() })))}
                >
                  テンプレートを読み込む
                </button>
              </div>
              <p className="small text-muted">
                登録済み: {awards.length ? awards.map((a) => a.name).join('、') : 'なし'}
              </p>
              {awardRows.map((row) => {
                const dup = awardPlan.skipped.includes(row)
                const update = (patch: Partial<AwardRow>) =>
                  setAwardRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, ...patch } : r)))
                return (
                  <div key={row.key} className="input-group input-group-sm mb-2">
                    <input
                      className={`form-control ${dup ? 'border-warning' : ''}`}
                      style={{ flex: '2 1 0' }}
                      value={row.name}
                      placeholder="賞の名前"
                      onChange={(e) => update({ name: e.target.value })}
                    />
                    <input
                      className="form-control"
                      style={{ flex: '3 1 0' }}
                      value={row.description}
                      placeholder="説明（任意）"
                      onChange={(e) => update({ description: e.target.value })}
                    />
                    <select
                      className="form-select"
                      style={{ flex: '0 0 110px' }}
                      value={row.color}
                      onChange={(e) => update({ color: e.target.value })}
                    >
                      {AWARD_COLORS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {dup ? <span className="input-group-text text-warning">登録済み</span> : null}
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      aria-label="行を削除"
                      onClick={() => setAwardRows((prev) => prev.filter((r) => r.key !== row.key))}
                    >
                      <i className="bi bi-x" />
                    </button>
                  </div>
                )
              })}
              <button
                type="button"
                className="btn btn-sm btn-link px-0"
                onClick={() => setAwardRows((prev) => [...prev, emptyAward()])}
              >
                <i className="bi bi-plus" /> 行を追加
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="d-flex align-items-center gap-3 mt-4">
        <button
          type="button"
          className="btn btn-danger"
          disabled={busy || categoryPlan.toCreate.length + awardPlan.toCreate.length === 0}
          onClick={onSubmit}
        >
          {busy
            ? '作成中…'
            : `一括作成（カテゴリ ${categoryPlan.toCreate.length} 件・アワード ${awardPlan.toCreate.length} 件）`}
        </button>
        <span className="small text-muted">名前が登録済みのものはスキップします。</span>
      </div>
    </AdminShell>
  )
}
