import type { AdminGachaStats } from '@/shared/api/v1Admin'
import { formatFetchedAt, formatHourLabel, resolveGachaFetchState } from '@/features/admin/lib/gachaStatsView'

type Props = {
  stats: AdminGachaStats | null
  error: string | null
  fetchedAt: Date | null
  refreshing: boolean
  onRefresh: () => void
}

export function GachaUsageBlock({ stats, error, fetchedAt, refreshing, onRefresh }: Props) {
  const state = resolveGachaFetchState({ hasStats: stats !== null, error })
  return (
    <div className="card border-0 shadow-sm mb-4" data-testid="gacha-usage">
      <div className="card-body">
        <div className="d-flex align-items-center mb-3">
          <h2 className="h6 fw-bold mb-0"><i className="bi bi-coin me-2 text-warning" />ガチャ使用状況</h2>
          {fetchedAt ? <span className="text-muted small ms-3">最終取得 {formatFetchedAt(fetchedAt)}</span> : null}
          <button type="button" className="btn btn-outline-secondary btn-sm ms-auto" disabled={refreshing} onClick={onRefresh}>
            {refreshing ? '更新中…' : '更新'}
          </button>
        </div>

        {state === 'loading' ? <p className="text-muted small mb-0">取得中…</p> : null}

        {state === 'error' || state === 'stale' ? (
          <p className="text-danger mb-2">ガチャ使用状況を取得できません（{error}）</p>
        ) : null}

        {stats && state !== 'error' ? (
          <div className={state === 'stale' ? 'opacity-50' : ''}>
            {state === 'stale' && fetchedAt ? (
              <p className="text-muted small mb-2">最終取得 {formatFetchedAt(fetchedAt)} の値</p>
            ) : null}
            <div className="d-flex flex-wrap gap-4 mb-3">
              <Stat label="使用済みコイン" value={`${stats.total_used} 枚`} />
              <Stat label="使用した参加者" value={`${stats.users_who_used} 人`} />
              <Stat label="コインを持つ参加者" value={`${stats.users_with_coins} 人`} />
            </div>
            <HourBars rows={stats.used_by_hour} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted small">{label}</div>
      <div className="fs-4 fw-semibold lh-1">{value}</div>
    </div>
  )
}

/** 既存「チェックイン推移」と同じ描き方（DashboardPage.tsx:170-202）。幅の正規化は表示のためだけ */
function HourBars({ rows }: { rows: AdminGachaStats['used_by_hour'] }) {
  if (rows.length === 0) return <p className="text-muted small mb-0">時間帯別: まだ使用がありません（0 件）</p>
  const max = Math.max(...rows.map((r) => r.count), 1)
  return (
    <div>
      <div className="text-muted small mb-1">時間帯別の使用数</div>
      <div className="d-flex flex-column gap-1" style={{ maxHeight: 200, overflowY: 'auto' }}>
        {rows.map((r) => (
          <div key={r.hour} className="d-flex align-items-center gap-2">
            <span className="text-muted" style={{ fontSize: '0.75rem', width: 44, flexShrink: 0 }}>{formatHourLabel(r.hour)}</span>
            <div className="flex-grow-1 progress" style={{ height: 16 }}>
              <div className="progress-bar bg-warning" style={{ width: `${(r.count / max) * 100}%` }} />
            </div>
            <span className="fw-semibold" style={{ fontSize: '0.8rem', width: 24, textAlign: 'right' }}>{r.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
