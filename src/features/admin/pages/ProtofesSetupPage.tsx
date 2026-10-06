import { useEffect, useMemo, useState } from 'react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { PROTOFES_BOOTHS, PROTOFES_CATEGORIES } from '@/features/admin/lib/protofesPreset'
import { isManagerUser, useAuthStore } from '@/shared/auth/authStore'
import {
  createAdminBooth,
  createAdminCategory,
  fetchAdminBoothSummaries,
  fetchAdminCategories,
  updateAdminBooth,
  type AdminBoothSummary,
  type AdminCategory,
} from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'

/**
 * プロトフェス用初期設定。
 * ブース番号（display_code）で既存ブースと突き合わせるので、何度押しても二重登録しない。
 */
export function ProtofesSetupPage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const isManager = isManagerUser(useAuthStore((s) => s.user))
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [booths, setBooths] = useState<AdminBoothSummary[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    if (!eventId) return
    const [cats, list] = await Promise.all([
      fetchAdminCategories(eventId),
      fetchAdminBoothSummaries(eventId, { sort: 'name', order: 'asc' }),
    ])
    setCategories(cats)
    setBooths(list)
  }

  useEffect(() => {
    reload().catch((e) => setError(formatClientError(e, '読み込みに失敗しました')))
  }, [eventId])

  const boothByCode = useMemo(
    () => new Map(booths.filter((b) => b.display_code).map((b) => [b.display_code!, b])),
    [booths],
  )
  const existingCategoryNames = new Set(categories.map((c) => c.name))
  const missingCategories = PROTOFES_CATEGORIES.filter((n) => !existingCategoryNames.has(n))
  const unregistered = PROTOFES_BOOTHS.filter((b) => !boothByCode.has(b.display_code))

  /** 足りないカテゴリを作り、カテゴリ名 → id の対応を返す */
  async function ensureCategories(): Promise<Map<string, string>> {
    const map = new Map(categories.map((c) => [c.name, c.id]))
    for (const name of PROTOFES_CATEGORIES) {
      if (map.has(name)) continue
      const created = await createAdminCategory(eventId!, { name })
      map.set(name, created.id)
    }
    return map
  }

  async function run(label: string, fn: () => Promise<string>) {
    if (!eventId || busy) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      setMessage(await fn())
    } catch (e) {
      setError(formatClientError(e, `${label}に失敗しました`))
    } finally {
      await reload().catch(() => {})
      setBusy(false)
    }
  }

  const onSetupCategories = () =>
    run('カテゴリ設定', async () => {
      const catIds = await ensureCategories()
      let assigned = 0
      for (const preset of PROTOFES_BOOTHS) {
        const booth = boothByCode.get(preset.display_code)
        if (!booth) continue
        await updateAdminBooth(eventId!, booth.id, { category_id: catIds.get(preset.category) })
        assigned++
      }
      return `カテゴリ ${missingCategories.length} 件を作成し、既存ブース ${assigned} 件に割り当てました`
    })

  const onBulkRegister = () =>
    run('ブース一括登録', async () => {
      if (!confirm(`未登録の ${unregistered.length} 件のブースを登録します。よろしいですか？`)) {
        return '中止しました'
      }
      const catIds = await ensureCategories()
      for (const preset of unregistered) {
        await createAdminBooth(eventId!, {
          name: preset.name,
          display_code: preset.display_code,
          description: preset.description,
          category_id: catIds.get(preset.category) ?? null,
        })
      }
      return `ブース ${unregistered.length} 件を登録しました（カテゴリも割り当て済み）`
    })

  if (!isManager) {
    return (
      <AdminShell title="プロトフェス用初期設定">
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" />
          運営管理者権限が必要です
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell title="プロトフェス用初期設定">
      {error ? <div className="alert alert-danger">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 card-title">
                <i className="bi bi-table me-1" />
                ブース一括登録
              </h2>
              <p className="small text-muted mb-2">
                プロトフェスの全 {PROTOFES_BOOTHS.length} ブースを登録します。ブース番号が同じブースは登録済みとみなしてスキップします。
              </p>
              <p className="small mb-3">
                未登録: <strong>{unregistered.length}</strong> 件
              </p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy || unregistered.length === 0}
                onClick={onBulkRegister}
              >
                {unregistered.length === 0 ? 'すべて登録済み' : `${unregistered.length} 件を登録`}
              </button>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 card-title">
                <i className="bi bi-tags me-1" />
                カテゴリ設定
              </h2>
              <p className="small text-muted mb-2">
                推薦用の {PROTOFES_CATEGORIES.length} カテゴリを作成し、登録済みのブースへ下表のとおり割り当てます（既存の割り当ては上書き）。
              </p>
              <p className="small mb-3">
                未作成のカテゴリ: <strong>{missingCategories.length}</strong> 件
              </p>
              <button
                type="button"
                className="btn btn-outline-primary"
                disabled={busy}
                onClick={onSetupCategories}
              >
                カテゴリを設定
              </button>
            </div>
          </div>
        </div>
      </div>

      {PROTOFES_CATEGORIES.map((cat) => {
        const rows = PROTOFES_BOOTHS.filter((b) => b.category === cat)
        return (
          <div key={cat} className="mb-3">
            <h3 className="h6">
              {cat} <span className="badge bg-secondary">{rows.length}</span>
              {existingCategoryNames.has(cat) ? null : (
                <span className="badge bg-warning text-dark ms-1">未作成</span>
              )}
            </h3>
            <table className="table table-sm small mb-0">
              <tbody>
                {rows.map((b) => (
                  <tr key={b.display_code}>
                    <td style={{ width: 48 }}>{b.display_code}</td>
                    <td>{b.name}</td>
                    <td className="text-muted">{b.description}</td>
                    <td style={{ width: 80 }}>
                      {boothByCode.has(b.display_code) ? (
                        <span className="badge bg-success">登録済み</span>
                      ) : (
                        <span className="badge bg-light text-dark">未登録</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </AdminShell>
  )
}
