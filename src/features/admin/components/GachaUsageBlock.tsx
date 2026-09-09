import type { AdminGachaStats } from '@/shared/api/v1Admin'

type Props = {
  stats: AdminGachaStats | null
  /** 取得に失敗しているときのメッセージ。null なら正常。「取れていない」と「0」は別物（issue #87） */
  error: string | null
}

/** 時刻の "HH:MM" 表記。ISO8601 を端末ロケールに寄せず時分だけ出す。 */
function hourLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * ガチャコインの当日使用状況（issue #87）。
 * サーバー（GET /admin/events/:id/gacha/stats）が返した値をそのまま出す。フロントで按分・独自集計しない。
 * 取得失敗時は 0 埋めせず「取得できない」と明示する。
 */
export function GachaUsageBlock({ stats, error }: Props) {
  const maxHour = stats ? Math.max(...stats.used_by_hour.map((h) => h.count), 1) : 1

  return (
    <div className="card border-0 shadow-sm mb-4" data-testid="gacha-usage">
      <div className="card-body">
        <h2 className="h6 fw-bold mb-3">
          <i className="bi bi-coin me-2" />
          ガチャコイン使用状況
        </h2>

        {error ? (
          <div className="text-danger">
            ガチャコイン使用状況を取得できません（{error}）
          </div>
        ) : !stats ? (
          <div className="text-muted">取得中…</div>
        ) : (
          <>
            <div className="d-flex flex-wrap gap-4 mb-3">
              <div>
                <div className="text-muted small">コイン獲得済みの参加者数</div>
                <div className="fs-3 fw-bold lh-1">{stats.users_with_coins}</div>
              </div>
              <div>
                <div className="text-muted small">使用済みコイン総数</div>
                <div className="fs-3 fw-bold lh-1">{stats.total_used}</div>
              </div>
              <div>
                <div className="text-muted small">使用した実人数</div>
                <div className="fs-3 fw-bold lh-1">{stats.users_who_used}</div>
              </div>
            </div>

            <div className="border-top pt-3">
              <div className="text-muted small mb-2">時間帯別の使用数</div>
              {stats.used_by_hour.length === 0 ? (
                <p className="text-muted small mb-0">まだ使用がありません</p>
              ) : (
                <div className="d-flex flex-column gap-1">
                  {stats.used_by_hour.map((h) => (
                    <div key={h.hour} className="d-flex align-items-center gap-2">
                      <span
                        className="text-muted"
                        style={{ fontSize: '0.75rem', width: 44, flexShrink: 0 }}
                      >
                        {hourLabel(h.hour)}
                      </span>
                      <div className="flex-grow-1 progress" style={{ height: 16 }}>
                        <div
                          className="progress-bar"
                          style={{ width: `${(h.count / maxHour) * 100}%`, backgroundColor: '#6f42c1' }}
                        />
                      </div>
                      <span
                        className="fw-semibold"
                        style={{ fontSize: '0.8rem', width: 28, textAlign: 'right' }}
                      >
                        {h.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
