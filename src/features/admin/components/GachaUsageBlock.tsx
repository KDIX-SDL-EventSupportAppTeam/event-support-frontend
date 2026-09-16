import { useState } from 'react'
import type { AdminGachaStats } from '@/shared/api/v1Admin'

type Props = {
  stats: AdminGachaStats | null
  /** 取得に失敗しているときのメッセージ。null なら正常。「取れていない」と「0」は別物（issue #87） */
  error: string | null
  /** manager のときだけ停止／再開スイッチを出す（issue #104）。viewer には出さない */
  canManage: boolean
  /** 停止／再開の実行。解決したら呼び出し側が stats を取り直す */
  onToggleEnabled: (next: boolean) => Promise<void>
}

/** 時刻の "HH:MM" 表記。ISO8601 を端末ロケールに寄せず時分だけ出す。 */
function hourLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * ガチャコインの当日使用状況（issue #87）と、当日の緊急停止／再開スイッチ（issue #104 / server #122）。
 * サーバー（GET /admin/events/:id/gacha/stats）が返した値をそのまま出す。フロントで按分・独自集計しない。
 * 取得失敗時は 0 埋めせず「取得できない」と明示する。
 */
export function GachaUsageBlock({ stats, error, canManage, onToggleEnabled }: Props) {
  const [confirm, setConfirm] = useState<null | boolean>(null) // 次に設定する is_enabled
  const [busy, setBusy] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)

  const maxHour = stats ? Math.max(...stats.used_by_hour.map((h) => h.count), 1) : 1
  const stopped = stats != null && !stats.is_enabled

  async function runToggle(next: boolean) {
    setBusy(true)
    setToggleError(null)
    try {
      await onToggleEnabled(next)
      setConfirm(null)
    } catch (e) {
      setToggleError(e instanceof Error ? e.message : '切り替えに失敗しました')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card border-0 shadow-sm mb-4" data-testid="gacha-usage">
      <div className="card-body">
        <h2 className="h6 fw-bold mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-coin" />
          ガチャコイン使用状況
          {stopped ? (
            <span className="badge bg-danger" data-testid="gacha-stopped-badge">
              停止中
            </span>
          ) : stats != null ? (
            <span className="badge bg-success-subtle text-success-emphasis">稼働中</span>
          ) : null}
        </h2>

        {error ? (
          <div className="text-danger">ガチャコイン使用状況を取得できません（{error}）</div>
        ) : !stats ? (
          <div className="text-muted">取得中…</div>
        ) : (
          <>
            {stopped ? (
              <div className="alert alert-warning py-2 px-3 small mb-3" role="status">
                現在ガチャを<strong>停止</strong>しています。参加者の画面にも停止中と表示されます。
                獲得済みのコインは消えません。
              </div>
            ) : null}

            <div className="d-flex flex-wrap gap-4 mb-3">
              <div>
                <div className="text-muted small">獲得済みコイン総数</div>
                <div className="fs-3 fw-bold lh-1">{stats.total_earned}</div>
              </div>
              <div>
                <div className="text-muted small">使用済みコイン総数</div>
                <div className="fs-3 fw-bold lh-1">{stats.total_used}</div>
              </div>
              <div>
                <div className="text-muted small">コイン獲得済みの参加者数</div>
                <div className="fs-3 fw-bold lh-1">{stats.users_with_coins}</div>
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
                      <span className="text-muted" style={{ fontSize: '0.75rem', width: 44, flexShrink: 0 }}>
                        {hourLabel(h.hour)}
                      </span>
                      <div className="flex-grow-1 progress" style={{ height: 16 }}>
                        <div
                          className="progress-bar"
                          style={{ width: `${(h.count / maxHour) * 100}%`, backgroundColor: '#6f42c1' }}
                        />
                      </div>
                      <span className="fw-semibold" style={{ fontSize: '0.8rem', width: 28, textAlign: 'right' }}>
                        {h.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {canManage ? (
              <div className="border-top pt-3 mt-3">
                {toggleError ? <div className="text-danger small mb-2">{toggleError}</div> : null}
                {confirm === null ? (
                  <button
                    type="button"
                    className={`btn btn-sm ${stopped ? 'btn-success' : 'btn-outline-danger'}`}
                    onClick={() => {
                      setToggleError(null)
                      setConfirm(stopped) // stopped の逆＝次の is_enabled。stopped=true→再開(true)
                    }}
                  >
                    {stopped ? 'ガチャを再開する' : 'ガチャを停止する'}
                  </button>
                ) : (
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <span className="small">
                      {confirm
                        ? 'ガチャを再開します。参加者がコインを使えるようになります。よろしいですか？'
                        : 'ガチャを停止します。参加者はコインを使えなくなります（コインは消えません）。よろしいですか？'}
                    </span>
                    <button
                      type="button"
                      className={`btn btn-sm ${confirm ? 'btn-success' : 'btn-danger'}`}
                      disabled={busy}
                      onClick={() => void runToggle(confirm)}
                    >
                      {busy ? '実行中…' : confirm ? '再開する' : '停止する'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      disabled={busy}
                      onClick={() => setConfirm(null)}
                    >
                      キャンセル
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
