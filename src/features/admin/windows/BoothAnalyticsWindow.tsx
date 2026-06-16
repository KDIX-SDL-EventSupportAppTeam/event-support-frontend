import { memo, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AnalyticsWindow } from '@/features/admin/components/AnalyticsWindow'
import { useAnalyticsData } from '@/features/admin/hooks/useAnalyticsData'
import { CHART_ANIMATION_OFF } from '@/features/admin/lib/chartOptions'
import { fetchBoothAnalytics, type BoothAnalytics } from '@/shared/api/v1Admin'

type SortKey =
  | 'checkin_desc'
  | 'checkin_asc'
  | 'rating_desc'
  | 'rating_asc'
  | 'rec_desc'
  | 'code_asc'
  | 'code_desc'
  | 'created_desc'
  | 'unvisited'

function boothStatus(b: BoothAnalytics['booths'][0], avgCheckins: number) {
  if (b.checkin_count === 0) return { label: '未訪問', className: 'bg-secondary' }
  if (b.avg_rating != null && b.avg_rating < 3) return { label: '低評価注意', className: 'bg-danger' }
  if (b.checkin_count >= avgCheckins && avgCheckins > 0) return { label: '人気', className: 'bg-success' }
  return null
}

type Props = {
  eventId: string
  active: boolean
  minimized: boolean
  onToggleMinimize: () => void
}

const BoothCard = memo(function BoothCard({
  booth: b,
  maxCheckin,
  avgCheckins,
}: {
  booth: BoothAnalytics['booths'][0]
  maxCheckin: number
  avgCheckins: number
}) {
  const status = boothStatus(b, avgCheckins)
  return (
    <div className="border rounded p-2 bg-white small" style={{ contentVisibility: 'auto' }}>
      <div className="d-flex justify-content-between align-items-start mb-1">
        <span className="fw-semibold text-truncate">{b.name}</span>
        {status ? <span className={`badge ${status.className}`}>{status.label}</span> : null}
      </div>
      <div className="text-muted">{b.manual_code}</div>
      {b.category ? <span className="badge bg-light text-dark border me-1">{b.category.name}</span> : null}
      {b.tags.map((t) => (
        <span key={t} className="badge bg-secondary me-1">
          {t}
        </span>
      ))}
      <div className="mt-2">
        <div className="d-flex justify-content-between">
          <span>チェックイン</span>
          <strong>{b.checkin_count}</strong>
        </div>
        <div className="progress" style={{ height: 4 }}>
          <div className="progress-bar" style={{ width: `${(b.checkin_count / maxCheckin) * 100}%` }} />
        </div>
      </div>
      <div className="mt-1">
        {b.avg_rating != null ? (
          <span>{'★'.repeat(Math.round(b.avg_rating))} ({b.avg_rating.toFixed(1)})</span>
        ) : (
          <span className="text-muted">未評価</span>
        )}
      </div>
      <div className="text-muted mt-1">
        QR {b.checkin_by_method.qr} / 手動 {b.checkin_by_method.manual}
      </div>
      {b.recommendation_acceptance_rate != null ? (
        <div className="text-muted">推薦採用 {b.recommendation_acceptance_rate}%</div>
      ) : null}
    </div>
  )
})

export const BoothAnalyticsWindow = memo(function BoothAnalyticsWindow({
  eventId,
  active,
  minimized,
  onToggleMinimize,
}: Props) {
  const { data, error } = useAnalyticsData(active, eventId, fetchBoothAnalytics, 'ブース分析の取得に失敗しました')
  const [sort, setSort] = useState<SortKey>('checkin_desc')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [unvisitedOnly, setUnvisitedOnly] = useState(false)
  const [ratedFilter, setRatedFilter] = useState<'all' | 'rated' | 'unrated'>('all')

  const categories = useMemo(() => {
    if (!data) return []
    const map = new Map<string, string>()
    for (const b of data.booths) {
      if (b.category) map.set(b.category.id, b.category.name)
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    let list = [...data.booths]
    if (categoryFilter !== 'all') {
      list = list.filter((b) => b.category?.id === categoryFilter)
    }
    if (unvisitedOnly) list = list.filter((b) => b.checkin_count === 0)
    if (ratedFilter === 'rated') list = list.filter((b) => b.avg_rating != null)
    if (ratedFilter === 'unrated') list = list.filter((b) => b.avg_rating == null)

    list.sort((a, b) => {
      switch (sort) {
        case 'checkin_desc':
          return b.checkin_count - a.checkin_count
        case 'checkin_asc':
          return a.checkin_count - b.checkin_count
        case 'rating_desc':
          return (b.avg_rating ?? -1) - (a.avg_rating ?? -1)
        case 'rating_asc':
          return (a.avg_rating ?? 99) - (b.avg_rating ?? 99)
        case 'rec_desc':
          return (b.recommendation_acceptance_rate ?? -1) - (a.recommendation_acceptance_rate ?? -1)
        case 'code_asc':
          return a.manual_code.localeCompare(b.manual_code)
        case 'code_desc':
          return b.manual_code.localeCompare(a.manual_code)
        case 'created_desc':
          return b.created_at.localeCompare(a.created_at)
        case 'unvisited':
          if (a.checkin_count === 0 && b.checkin_count > 0) return -1
          if (b.checkin_count === 0 && a.checkin_count > 0) return 1
          return b.checkin_count - a.checkin_count
        default:
          return 0
      }
    })
    return list
  }, [data, sort, categoryFilter, unvisitedOnly, ratedFilter])

  const avgCheckins = data
    ? data.booths.reduce((s, b) => s + b.checkin_count, 0) / Math.max(data.booths.length, 1)
    : 0
  const maxCheckin = Math.max(...filtered.map((b) => b.checkin_count), 1)

  return (
    <AnalyticsWindow
      title="ブース分析"
      icon="bi-shop"
      minimized={minimized}
      onToggleMinimize={onToggleMinimize}
    >
      {error ? <p className="text-danger small">{error}</p> : null}
      {!data ? (
        <div className="text-muted small">読み込み中…</div>
      ) : (
        <>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="checkin_desc">チェックイン多い順</option>
              <option value="checkin_asc">チェックイン少ない順</option>
              <option value="rating_desc">評価高い順</option>
              <option value="rating_asc">評価低い順</option>
              <option value="rec_desc">推薦採用率高い順</option>
              <option value="code_asc">コード昇順</option>
              <option value="code_desc">コード降順</option>
              <option value="created_desc">作成新しい順</option>
              <option value="unvisited">未訪問優先</option>
            </select>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">全カテゴリ</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="form-check form-check-inline small mb-0">
              <input
                type="checkbox"
                className="form-check-input"
                checked={unvisitedOnly}
                onChange={(e) => setUnvisitedOnly(e.target.checked)}
              />
              未訪問のみ
            </label>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={ratedFilter}
              onChange={(e) => setRatedFilter(e.target.value as 'all' | 'rated' | 'unrated')}
            >
              <option value="all">評価すべて</option>
              <option value="rated">評価あり</option>
              <option value="unrated">未評価</option>
            </select>
          </div>

          {data.category_summary.length > 0 ? (
            <div className="mb-3" style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.category_summary} layout="vertical" margin={{ left: 60 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="category_name" width={55} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar {...CHART_ANIMATION_OFF} dataKey="total_checkins" fill="#0d6efd" name="チェックイン" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          <div
            className="gap-2"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            }}
          >
            {filtered.map((b) => (
              <BoothCard key={b.id} booth={b} maxCheckin={maxCheckin} avgCheckins={avgCheckins} />
            ))}
          </div>
        </>
      )}
    </AnalyticsWindow>
  )
})
