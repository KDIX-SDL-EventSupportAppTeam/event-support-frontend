import type { AdminDashboardBingo, RecommenderState } from '@/shared/api/v1Admin'
import { fallbackLevel, reasonMessage, remainingToNext } from '@/features/admin/lib/recommenderStateView'

type Props = { bingo: AdminDashboardBingo; rec: RecommenderState | null; recError: string | null }

const pct = (v: number) => `${Math.round(v * 1000) / 10}%`

export function LiveMonitoringBlock({ bingo, rec, recError }: Props) {
  return (
    <div className="card border-0 shadow-sm mb-4" data-testid="live-monitoring">
      <div className="card-body">
        <h2 className="h6 fw-bold mb-3">
          <i className="bi bi-activity me-2" />
          当日監視
        </h2>

        {/* 1行目: 評価回収率（画面内で最大） */}
        <div className="d-flex align-items-end gap-3 mb-3">
          <div>
            <div className="text-muted small">評価回収率</div>
            <div className="fw-bold lh-1" style={{ fontSize: '3.5rem' }}>
              {pct(bingo.rating_collection_rate)}
            </div>
          </div>
          <div className="text-muted small pb-2">
            評価数 {bingo.ratings} / チェックイン数 {bingo.checkins}
          </div>
        </div>

        {/* 2行目: 推薦エンジンの状態 */}
        <div className="border-top pt-3 mb-3">
          <div className="text-muted small mb-1">推薦エンジンの状態</div>
          {recError ? (
            <div className="text-danger">推薦エンジンの状態を取得できません（{recError}）</div>
          ) : !rec ? (
            <div className="text-muted">取得中…</div>
          ) : !rec.available ? (
            <div className="text-danger fw-semibold">{reasonMessage(rec.reason)}</div>
          ) : (
            <RecState state={rec.state} bingoRatings={bingo.ratings} />
          )}
        </div>

        {/* 3行目: 解放とフォールバック */}
        <div className="border-top pt-3 d-flex flex-wrap gap-4">
          <div>
            <div className="text-muted small">解放到達人数（1回目 / 2回目 / 3回目）</div>
            <div className="fs-4 fw-semibold">
              {bingo.unlocks.first} / {bingo.unlocks.second} / {bingo.unlocks.third}
            </div>
          </div>
          <div>
            <div className="text-muted small">直近30分のフォールバック率</div>
            <div
              className={`fs-4 fw-semibold ${
                fallbackLevel(bingo.fallback_rate_last_30min) === 'danger'
                  ? 'text-danger'
                  : fallbackLevel(bingo.fallback_rate_last_30min) === 'warning'
                    ? 'text-warning'
                    : ''
              }`}
            >
              {pct(bingo.fallback_rate_last_30min)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RecState({
  state,
  bingoRatings,
}: {
  state: NonNullable<Extract<RecommenderState, { available: true }>['state']>
  bingoRatings: number
}) {
  const size = state.snapshot?.decision_table_size
  const remaining = remainingToNext(state)
  const gate = state.phase?.gate_detail
  return (
    <dl className="row mb-0 small">
      <dt className="col-5 col-md-3">現在のフェーズ</dt>
      <dd className="col-7 col-md-9 fw-semibold">{state.phase?.current ?? '（応答にフェーズが無い）'}</dd>
      <dt className="col-5 col-md-3">決定表の件数</dt>
      <dd className="col-7 col-md-9">
        {size == null ? '（未取り込み）' : size}
        <span className="text-muted ms-2">評価数 {bingoRatings} との差は取り込み待ち（最大5分）</span>
      </dd>
      <dt className="col-5 col-md-3">次のしきい値まで</dt>
      <dd className="col-7 col-md-9">{remaining == null ? '（計算できない）' : remaining.label}</dd>
      <dt className="col-5 col-md-3">品質ゲート</dt>
      <dd className="col-7 col-md-9">
        {gate
          ? (['size', 'rules', 'gamma', 'coverage'] as const).map((k) => (
              <span key={k} className="me-3">
                {k}: {gate[k] === true ? '○' : gate[k] === false ? '×' : '？'}
              </span>
            ))
          : '（応答に gate_detail が無い）'}
      </dd>
      <dt className="col-5 col-md-3">最終取り込み時刻</dt>
      <dd className="col-7 col-md-9">
        {state.snapshot?.built_at ? new Date(state.snapshot.built_at).toLocaleString('ja-JP') : '（未取り込み）'}
      </dd>
    </dl>
  )
}
