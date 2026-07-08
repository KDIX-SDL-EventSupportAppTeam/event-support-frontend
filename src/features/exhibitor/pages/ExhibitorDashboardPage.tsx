import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useExhibitorStats } from '@/features/exhibitor/hooks/useExhibitorStats'
import { useExhibitorStore } from '@/features/exhibitor/store/exhibitorStore'
import { useAuthStore } from '@/shared/auth/authStore'

/** 運営画面 AnalyticsWindow と同じ体裁の折りたたみカード（admin フィーチャーへの越境importを避け複製） */
function ExhibitorWindow({
  title,
  icon,
  children,
}: {
  title: string
  icon: string
  children: React.ReactNode
}) {
  const [minimized, setMinimized] = useState(false)
  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-header bg-white d-flex align-items-center justify-content-between py-2">
        <span className="fw-semibold small">
          <i className={`bi ${icon} me-1`} />
          {title}
        </span>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary py-0 px-2"
          onClick={() => setMinimized((m) => !m)}
          aria-label={minimized ? '展開' : '最小化'}
        >
          <i className={`bi ${minimized ? 'bi-chevron-down' : 'bi-chevron-up'}`} />
        </button>
      </div>
      {!minimized ? <div className="card-body">{children}</div> : null}
    </div>
  )
}

/**
 * 出展者ダッシュボード（/exhibitor）。
 * ガードは RequireAuth のみ（判定が非同期API依存のため RequireExhibitor は作らず、
 * ページ内で「ロード中→権限なし→担当ブース0→通常表示」の順に分岐する）。
 * 仕様: 改修プラン frontend_43_出展者管理画面.md §4-7
 * 通常表示（分岐4）の見た目は運営管理画面（AdminShell + AdminSidebar + AnalyticsWindow +
 * ParticipantAnalyticsWindow の統計小箱）を鏡写しにする。admin フィーチャーからは import せず、
 * 同じクラス構成をこのファイル内に複製する（越境import禁止のため）。
 */
export function ExhibitorDashboardPage() {
  const navigate = useNavigate()
  const eventId = useAuthStore((s) => s.user?.event_id)
  const userId = useAuthStore((s) => s.user?.id)
  const clearSession = useAuthStore((s) => s.clearSession)
  const loginName = useAuthStore((s) => s.user?.display_name)

  const loaded = useExhibitorStore((s) => s.loaded)
  const isExhibitor = useExhibitorStore((s) => s.isExhibitor)
  const booths = useExhibitorStore((s) => s.booths)
  const ensureLoaded = useExhibitorStore((s) => s.ensureLoaded)
  const resetExhibitor = useExhibitorStore((s) => s.reset)

  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId || !userId) return
    ensureLoaded(eventId, userId)
  }, [eventId, userId, ensureLoaded])

  useEffect(() => {
    if (booths.length > 0 && !selectedBoothId) {
      setSelectedBoothId(booths[0].id)
    }
  }, [booths, selectedBoothId])

  const { data, error } = useExhibitorStats(eventId, selectedBoothId)

  const sortedComments = useMemo(() => {
    if (!data) return []
    return [...data.comments].sort(
      (a, b) => new Date(b.rated_at).getTime() - new Date(a.rated_at).getTime(),
    )
  }, [data])

  function onLogout() {
    clearSession()
    resetExhibitor()
    navigate('/login')
  }

  // 1. ロード中はスピナー（HomePage:150-155 と同じ形）
  if (!loaded) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">読み込み中...</p>
      </div>
    )
  }

  // 2. 出展者権限なし（403相当の見た目。データは一切出さない）
  if (!isExhibitor) {
    return (
      <div className="text-center p-5">
        <p className="mb-3">出展者権限がありません。参加者ホームに戻る</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/home')}>
          参加者ホームへ
        </button>
      </div>
    )
  }

  // 3. 担当ブース未設定
  if (booths.length === 0) {
    return (
      <div className="text-center p-5">
        <p className="mb-0">担当ブースが未設定です。運営にお問い合わせください</p>
      </div>
    )
  }

  // 4. 通常表示
  const selectedBoothName =
    booths.find((b) => b.id === selectedBoothId)?.name ?? booths[0].name

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* サイドバー（AdminSidebar の鏡写し。上部=現在ブース名、中央=担当ブース一覧＋画面切替、下部=ログアウト） */}
      <aside
        className="bg-dark text-white d-flex flex-column flex-shrink-0"
        style={{ width: 220, minHeight: '100vh' }}
      >
        <div className="p-3 border-bottom border-secondary">
          <span className="text-white fw-bold d-block">
            <i className="bi bi-shop me-1" />
            出展者ビュー
          </span>
          <div className="mt-2">
            <div className="text-white small text-truncate">{selectedBoothName}</div>
          </div>
          {loginName ? (
            <div className="text-white-50 mt-2 text-truncate" style={{ fontSize: '0.75rem' }}>
              ログイン中: {loginName}
            </div>
          ) : null}
        </div>

        <nav className="flex-grow-1 overflow-auto py-2">
          <div className="px-3 py-1 text-white-50 small text-uppercase">担当ブース</div>
          {booths.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBoothId(b.id)}
              className={`d-flex align-items-center gap-2 px-3 py-2 border-0 w-100 text-start ${
                b.id === selectedBoothId ? 'bg-white text-dark' : 'bg-transparent text-white-50'
              }`}
              style={{ fontSize: '0.85rem' }}
            >
              <i className="bi bi-shop" />
              {b.name}
            </button>
          ))}

          <div className="px-3 py-1 mt-2 text-white-50 small text-uppercase">画面</div>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="d-flex align-items-center gap-2 px-3 py-2 border-0 w-100 text-start bg-transparent text-white-50"
            style={{ fontSize: '0.85rem' }}
          >
            <i className="bi bi-person" />
            参加者画面へ
          </button>
        </nav>

        <div className="p-3 border-top border-secondary">
          <button type="button" className="btn btn-outline-light btn-sm w-100" onClick={onLogout}>
            <i className="bi bi-box-arrow-right me-1" />
            ログアウト
          </button>
        </div>
      </aside>

      <main className="flex-grow-1 overflow-auto">
        <div className="p-4">
          {/* ヘッダーカード（運営メニューのイベント情報カードの鏡写し） */}
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <span className="badge bg-dark rounded-pill mb-2">出展者ビュー</span>
              <h1 className="h3 fw-bold mb-0">
                <i className="bi bi-shop me-2" />
                {selectedBoothName}
              </h1>
            </div>
          </div>

          {error ? (
            <div className="alert alert-danger d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill" />
              {error}
            </div>
          ) : null}

          {!data ? (
            <div className="text-center p-4 text-muted">読み込み中…</div>
          ) : (
            <>
              {/* ブース統計（ParticipantAnalyticsWindow の統計小箱の鏡写し） */}
              <ExhibitorWindow title="ブース統計" icon="bi-clipboard-data">
                <div className="row g-2">
                  <div className="col-4">
                    <div className="border rounded p-2 text-center">
                      <div className="fw-bold fs-4">{data.total_checkins}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        チェックイン総数
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="border rounded p-2 text-center">
                      <div className="fw-bold fs-4">
                        {data.ratings.avg_rating !== null ? (
                          <>
                            <span className="text-warning">★</span> {data.ratings.avg_rating.toFixed(1)}
                          </>
                        ) : (
                          '—'
                        )}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        平均評価
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="border rounded p-2 text-center">
                      <div className="fw-bold fs-4">{data.ratings.count}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        評価件数
                      </div>
                    </div>
                  </div>
                </div>
              </ExhibitorWindow>

              <ExhibitorWindow title="時間帯別チェックイン" icon="bi-bar-chart">
                {data.hourly_checkins.length === 0 ? (
                  <p className="text-muted small mb-0">まだチェックインがありません</p>
                ) : (
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.hourly_checkins}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time_slot" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar isAnimationActive={false} dataKey="count" fill="#f8730d" name="チェックイン数" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </ExhibitorWindow>

              <ExhibitorWindow title="コメント一覧" icon="bi-chat-square-text">
                {sortedComments.length === 0 ? (
                  <p className="text-muted small mb-0">まだコメントがありません</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {sortedComments.map((c) => (
                      <div key={c.id} className="list-group-item px-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-warning">
                            {'★'.repeat(c.rating)}
                            {'☆'.repeat(Math.max(0, 5 - c.rating))}
                          </span>
                          <span className="text-muted small">{new Date(c.rated_at).toLocaleString('ja-JP')}</span>
                        </div>
                        {c.comment ? <div className="mt-1">{c.comment}</div> : null}
                      </div>
                    ))}
                  </div>
                )}
              </ExhibitorWindow>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
