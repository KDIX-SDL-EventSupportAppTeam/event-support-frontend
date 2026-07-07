import { memo, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AnalyticsWindow } from '@/features/admin/components/AnalyticsWindow'
import { useAnalyticsData } from '@/features/admin/hooks/useAnalyticsData'
import { CHART_ANIMATION_OFF } from '@/features/admin/lib/chartOptions'
import { fetchParticipantAnalytics } from '@/shared/api/v1Admin'
import { useAuthStore } from '@/shared/auth/authStore'

const PIE_COLORS = ['#0d6efd', '#198754', '#fd7e14', '#6f42c1', '#0dcaf0', '#dc3545']

type Props = {
  eventId: string
  active: boolean
  minimized: boolean
  onToggleMinimize: () => void
}

export const ParticipantAnalyticsWindow = memo(function ParticipantAnalyticsWindow({
  eventId,
  active,
  minimized,
  onToggleMinimize,
}: Props) {
  const token = useAuthStore((s) => s.token)
  const { data, error } = useAnalyticsData(
    active,
    eventId,
    fetchParticipantAnalytics,
    '参加者分析の取得に失敗しました',
    { pollMs: 60_000, refetchEvents: ['checkin:new'], token },
  )
  // 運営ロールは manager / viewer（旧 admin も互換のため含む）。「運営のみ」は participant 以外で判定する
  const [roleFilter, setRoleFilter] = useState<'all' | 'participant' | 'staff'>('participant')
  const [checkinFilter, setCheckinFilter] = useState<'all' | 'checked' | 'none'>('all')

  const filteredParticipants = useMemo(() => {
    if (!data) return []
    return data.participants.filter((p) => {
      if (roleFilter === 'participant' && p.role !== 'participant') return false
      if (roleFilter === 'staff' && p.role === 'participant') return false
      if (checkinFilter === 'checked' && p.total_checkins === 0) return false
      if (checkinFilter === 'none' && p.total_checkins > 0) return false
      return true
    })
  }, [data, roleFilter, checkinFilter])

  const momentum = useMemo(() => {
    if (!data) return null
    const { rolling_30min, rolling_30min_prev } = data.summary
    if (rolling_30min_prev === 0) return rolling_30min > 0 ? '盛り上がり中 ↑' : null
    const rate = ((rolling_30min - rolling_30min_prev) / rolling_30min_prev) * 100
    if (rate > 10) return `盛り上がり中 ↑ (+${Math.round(rate)}%)`
    if (rate < -10) return `落ち着き中 ↓ (${Math.round(rate)}%)`
    return '横ばい →'
  }, [data])

  const surveyPie = (record: Record<string, number> | undefined) => {
    if (!record) return []
    return Object.entries(record).map(([name, value]) => ({ name, value }))
  }

  return (
    <AnalyticsWindow
      title="参加者分析"
      icon="bi-people"
      minimized={minimized}
      onToggleMinimize={onToggleMinimize}
    >
      {error ? <p className="text-danger small">{error}</p> : null}
      {!data ? (
        <div className="text-muted small">読み込み中…</div>
      ) : (
        <>
          <div className="row g-2 mb-3">
            <div className="col-4">
              <div className="border rounded p-2 text-center">
                <div className="fw-bold">{data.summary.rolling_30min}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                  直近30分
                </div>
              </div>
            </div>
            <div className="col-4">
              <div className="border rounded p-2 text-center">
                <div className="fw-bold">{data.summary.rolling_10min}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                  直近10分
                </div>
              </div>
            </div>
            <div className="col-4">
              <div className="border rounded p-2 text-center">
                <div className="fw-bold small">{momentum ?? '—'}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                  前30分比
                </div>
              </div>
            </div>
          </div>

          {data.joining_timeline.length > 0 ? (
            <div style={{ height: 160 }} className="mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.joining_timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time_slot" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    {...CHART_ANIMATION_OFF}
                    type="monotone"
                    dataKey="new_participants"
                    stackId="1"
                    stroke="#0d6efd"
                    fill="#0d6efd33"
                    name="新規参加"
                  />
                  <Area
                    {...CHART_ANIMATION_OFF}
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#198754"
                    fill="none"
                    name="累積"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {data.checkin_distribution.length > 0 ? (
            <div style={{ height: 100 }} className="mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.checkin_distribution}>
                  <XAxis dataKey="checkin_count" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar {...CHART_ANIMATION_OFF} dataKey="num_users" fill="#6f42c1" name="人数" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {data.survey_distribution ? (
            <div className="row g-2 mb-3">
              {(['age_range', 'occupation', 'industry'] as const).map((key) => {
                const pie = surveyPie(data.survey_distribution?.[key])
                if (pie.length === 0) return null
                const label = key === 'age_range' ? '年齢層' : key === 'occupation' ? '職業' : '業種'
                return (
                  <div key={key} className="col-md-4">
                    <div className="small fw-semibold mb-1">{label}</div>
                    <div style={{ height: 100 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            {...CHART_ANIMATION_OFF}
                            data={pie}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={40}
                          >
                            {pie.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted small mb-3">アンケートデータなし</p>
          )}

          <div className="d-flex flex-wrap gap-2 mb-2">
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            >
              <option value="all">全ロール</option>
              <option value="participant">参加者のみ</option>
              <option value="staff">運営のみ</option>
            </select>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={checkinFilter}
              onChange={(e) => setCheckinFilter(e.target.value as typeof checkinFilter)}
            >
              <option value="all">すべて</option>
              <option value="checked">チェックイン済</option>
              <option value="none">未チェックイン</option>
            </select>
          </div>

          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            <table className="table table-sm table-striped mb-0">
              <thead>
                <tr>
                  <th>名前</th>
                  <th>CI</th>
                  <th>初回CI</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.slice(0, 50).map((p) => (
                  <tr key={p.id}>
                    <td className="text-truncate" style={{ maxWidth: 100 }}>
                      {p.display_name || p.email}
                    </td>
                    <td>{p.total_checkins}</td>
                    <td className="small text-muted">
                      {p.first_checkin_at ? new Date(p.first_checkin_at).toLocaleTimeString('ja-JP') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AnalyticsWindow>
  )
})
