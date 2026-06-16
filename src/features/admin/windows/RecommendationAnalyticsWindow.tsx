import { memo, useMemo } from 'react'
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
import { fetchRecommendationAnalytics } from '@/shared/api/v1Admin'

type Props = {
  eventId: string
  active: boolean
  minimized: boolean
  onToggleMinimize: () => void
}

export const RecommendationAnalyticsWindow = memo(function RecommendationAnalyticsWindow({
  eventId,
  active,
  minimized,
  onToggleMinimize,
}: Props) {
  const { data, error } = useAnalyticsData(
    active,
    eventId,
    fetchRecommendationAnalytics,
    '推薦分析の取得に失敗しました',
  )

  const chartData = useMemo(
    () =>
      data?.by_booth
        .filter((b) => b.offered_count > 0)
        .slice(0, 8)
        .map((b) => ({
          name: b.booth_name.length > 8 ? `${b.booth_name.slice(0, 8)}…` : b.booth_name,
          rate: b.acceptance_rate ?? 0,
        })) ?? [],
    [data],
  )

  return (
    <AnalyticsWindow
      title="推薦分析"
      icon="bi-lightning"
      minimized={minimized}
      onToggleMinimize={onToggleMinimize}
    >
      {error ? <p className="text-danger small">{error}</p> : null}
      {!data ? (
        <div className="text-muted small">読み込み中…</div>
      ) : (
        <>
          <div className="row g-2 mb-3">
            <div className="col-6 col-md-3">
              <div className="border rounded p-2 text-center">
                <div className="fw-bold">{data.summary.total_recommendations}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                  総推薦回数
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="border rounded p-2 text-center">
                <div className="fw-bold">{data.summary.acceptance_rate}%</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                  選択率
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="border rounded p-2 text-center">
                <div className="fw-bold">{data.summary.open_count}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                  オープン推薦
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="border rounded p-2 text-center">
                <div className="fw-bold">{data.summary.algorithm}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                  アルゴリズム
                </div>
              </div>
            </div>
          </div>

          <div className="alert alert-light border small mb-3 py-2">
            <strong>MAB（マルチアームドバンディット）</strong>
            : 過去のチェックイン・評価データをもとに、参加者ごとに最適なブース候補を提示します。
            提示されているのに選ばれないブースは運営フォローのサインになります。
          </div>

          {chartData.length > 0 ? (
            <div style={{ height: 140 }} className="mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 50 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={48} tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v) => [`${v}%`, '採用率']} />
                  <Bar {...CHART_ANIMATION_OFF} dataKey="rate" fill="#6f42c1" name="採用率" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted small">推薦データなし</p>
          )}

          {data.conversion.selected_total > 0 ? (
            <div className="small mb-3">
              <strong>推薦→チェックイン:</strong>{' '}
              {data.conversion.conversion_rate ?? 0}%（{data.conversion.selected_then_checkedin}/
              {data.conversion.selected_total}）
              {data.conversion.avg_minutes_to_checkin != null
                ? ` / 平均 ${data.conversion.avg_minutes_to_checkin} 分`
                : null}
            </div>
          ) : null}

          {data.transitions.length > 0 ? (
            <>
              <div className="small fw-semibold mb-1">ブース遷移（上位）</div>
              <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                <table className="table table-sm mb-0">
                  <tbody>
                    {data.transitions.slice(0, 10).map((t, i) => (
                      <tr key={i}>
                        <td className="small">{t.from_booth_name}</td>
                        <td className="text-muted px-1">→</td>
                        <td className="small">{t.to_booth_name}</td>
                        <td className="text-end">{t.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-muted small mb-0">
              遷移データ不足（参加者が増えると表示されます）
            </p>
          )}
        </>
      )}
    </AnalyticsWindow>
  )
})
