import { memo, useEffect, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
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
import {
  fetchCheckinAnalytics,
  type CheckinAnalytics,
  type CheckinNewEvent,
} from '@/shared/api/v1Admin'
import { connectSocket, disconnectSocket } from '@/shared/api/socket'
import { useAuthStore } from '@/features/auth/store/authStore'

const METHOD_COLORS = ['#0d6efd', '#fd7e14']

type Props = {
  eventId: string
  active: boolean
  minimized: boolean
  onToggleMinimize: () => void
}

export const CheckinAnalyticsWindow = memo(function CheckinAnalyticsWindow({
  eventId,
  active,
  minimized,
  onToggleMinimize,
}: Props) {
  const token = useAuthStore((s) => s.token)
  const { data, error } = useAnalyticsData(
    active,
    eventId,
    fetchCheckinAnalytics,
    'チェックイン分析の取得に失敗しました',
    { pollMs: 60_000, refetchEvents: ['checkin:new'], token },
  )
  const [recent, setRecent] = useState<CheckinAnalytics['recent']>([])

  useEffect(() => {
    if (data?.recent) setRecent(data.recent)
  }, [data])

  useEffect(() => {
    if (!active || !token || !eventId) return
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
    const socket = connectSocket(token, apiBase)
    const onNew = (payload: CheckinNewEvent) => {
      setRecent((prev) =>
        [
          {
            id: `${payload.booth_id}-${payload.checked_in_at}`,
            booth_name: payload.booth_name,
            user_display_name: payload.user_display_name,
            method: 'qr',
            checked_in_at: payload.checked_in_at,
          },
          ...prev,
        ].slice(0, 20),
      )
    }
    socket.on('checkin:new', onNew)
    return () => {
      socket.off('checkin:new', onNew)
      disconnectSocket()
    }
  }, [active, token, eventId])

  const methodPie = data
    ? [
        { name: 'QR', value: data.by_method.qr },
        { name: '手動', value: data.by_method.manual },
      ].filter((d) => d.value > 0)
    : []

  return (
    <AnalyticsWindow
      title="チェックイン分析"
      icon="bi-qr-code-scan"
      minimized={minimized}
      onToggleMinimize={onToggleMinimize}
    >
      {error ? <p className="text-danger small">{error}</p> : null}
      {!data ? (
        <div className="text-muted small">読み込み中…</div>
      ) : (
        <>
          {data.peak_slot ? (
            <div className="alert alert-warning py-2 small mb-3">
              <i className="bi bi-graph-up-arrow me-1" />
              ピーク: {data.peak_slot}〜（{data.peak_count}件） / 合計 {data.total}件
            </div>
          ) : null}

          {data.timeline.length > 0 ? (
            <div style={{ height: 180 }} className="mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time_slot" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar {...CHART_ANIMATION_OFF} yAxisId="left" dataKey="count" fill="#0d6efd" name="新規CI" />
                  <Line
                    {...CHART_ANIMATION_OFF}
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#198754"
                    name="累積"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {methodPie.length > 0 ? (
            <div style={{ height: 120 }} className="mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    {...CHART_ANIMATION_OFF}
                    data={methodPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={45}
                  >
                    {methodPie.map((_, i) => (
                      <Cell key={i} fill={METHOD_COLORS[i % METHOD_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          <div className="small fw-semibold mb-2">
            <i className="bi bi-lightning-charge me-1" />
            リアルタイム（最大20件）
          </div>
          {recent.length === 0 ? (
            <p className="text-muted small mb-0">まだチェックインがありません</p>
          ) : (
            <div className="d-flex flex-column gap-1" style={{ maxHeight: 160, overflowY: 'auto' }}>
              {recent.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="d-flex align-items-center gap-2 p-1 rounded small"
                  style={{ backgroundColor: idx === 0 ? '#fff3cd' : '#f8f9fa' }}
                >
                  <span className="fw-semibold">{item.user_display_name}</span>
                  <span className="text-muted">→</span>
                  <span>{item.booth_name}</span>
                  <span className="badge bg-light text-dark border ms-auto">{item.method}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AnalyticsWindow>
  )
})
