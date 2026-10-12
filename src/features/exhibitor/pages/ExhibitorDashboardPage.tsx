import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useExhibitorStats } from '@/features/exhibitor/hooks/useExhibitorStats'
import { useExhibitorStore } from '@/features/exhibitor/store/exhibitorStore'
import { useAuthStore } from '@/shared/auth/authStore'
import { entryPathForRedirect } from '@/shared/lib/lastEventId'
import { starFillStates } from '@/shared/config/rating'
import '@/features/exhibitor/styles/exhibitor.scss'

/** 折りたたみできるカード。参加者画面と同じ角丸カードの体裁（色は exhibitor.scss の水色トークン） */
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
    <section className="exhibitor-card">
      <button
        type="button"
        className="exhibitor-card__header"
        onClick={() => setMinimized((m) => !m)}
        aria-expanded={!minimized}
      >
        <span>
          <i className={`bi ${icon}`} />
          {title}
        </span>
        <i className={`bi ${minimized ? 'bi-chevron-down' : 'bi-chevron-up'} exhibitor-card__toggle`} />
      </button>
      {!minimized ? <div className="exhibitor-card__body">{children}</div> : null}
    </section>
  )
}

/**
 * 出展者ダッシュボード（/exhibitor）。
 * ガードは RequireAuth のみ（判定が非同期API依存のため RequireExhibitor は作らず、
 * ページ内で「ロード中→権限なし→担当ブース0→通常表示」の順に分岐する）。
 * 仕様: 改修プラン frontend_43_出展者管理画面.md §4-7
 * 見た目は参加者画面と同じスマホ優先の1カラム（PC では中央寄せで幅を抑える）。
 * 参加者画面と取り違えないよう、テーマカラーは水色（exhibitor.scss）。
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
    navigate(entryPathForRedirect())
  }

  // 1. ロード中はスピナー
  if (!loaded) {
    return (
      <div className="exhibitor-page">
        <div className="exhibitor-state">
          <div className="spinner-border" role="status" style={{ color: 'var(--ex-sky-strong)' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mb-0">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 2. 出展者権限なし（403相当の見た目。データは一切出さない）
  if (!isExhibitor) {
    return (
      <div className="exhibitor-page">
        <div className="exhibitor-state">
          <img src="/mascot/mascot-with-gavel.png" alt="" className="exhibitor-state__mascot" />
          <p className="mb-0">出展者権限がありません。参加者ホームに戻る</p>
          <button type="button" className="exhibitor-btn" onClick={() => navigate('/home')}>
            参加者ホームへ
          </button>
        </div>
      </div>
    )
  }

  // 3. 担当ブース未設定
  if (booths.length === 0) {
    return (
      <div className="exhibitor-page">
        <div className="exhibitor-state">
          <img src="/mascot/mascot-with-gavel.png" alt="" className="exhibitor-state__mascot" />
          <p className="mb-0">担当ブースが未設定です。運営にお問い合わせください</p>
        </div>
      </div>
    )
  }

  // 4. 通常表示
  const selectedBoothName =
    booths.find((b) => b.id === selectedBoothId)?.name ?? booths[0].name

  return (
    <div className="exhibitor-page">
      <header className="exhibitor-header">
        <div className="exhibitor-header__inner">
          <div className="exhibitor-header__title">
            <span className="exhibitor-header__badge">
              <i className="bi bi-shop me-1" />
              出展者ビュー
            </span>
            <h1 className="exhibitor-header__booth">{selectedBoothName}</h1>
            {loginName ? <div className="exhibitor-header__user">ログイン中: {loginName}</div> : null}
          </div>
          <button type="button" className="exhibitor-header__action" onClick={onLogout}>
            <i className="bi bi-box-arrow-right" />
            ログアウト
          </button>
        </div>
      </header>

      <main className="exhibitor-body">
        {/* 担当ブースが複数あるときだけ切替チップを出す */}
        {booths.length > 1 ? (
          <nav className="exhibitor-booth-tabs" aria-label="担当ブース">
            {booths.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBoothId(b.id)}
                className={`exhibitor-booth-tab${b.id === selectedBoothId ? ' exhibitor-booth-tab--active' : ''}`}
                aria-pressed={b.id === selectedBoothId}
              >
                <i className="bi bi-shop" />
                {b.name}
              </button>
            ))}
          </nav>
        ) : null}

        {/* イメージキャラのあいさつ（参加者画面と同じキャラで、出展者向けの声かけ） */}
        <section className="exhibitor-greeting">
          <img src="/mascot/mascot-with-gavel.png" alt="" className="exhibitor-greeting__mascot" />
          <div className="exhibitor-greeting__bubble">
            <p className="exhibitor-greeting__title">出展ありがとうございます！</p>
            <p className="exhibitor-greeting__text">来場者のチェックインや評価がここに届きます。</p>
          </div>
        </section>

        {/* 参加者画面への導線。行き先が分かるよう参加者画面のテーマ色（黄）で目立たせる */}
        <button type="button" className="exhibitor-to-participant" onClick={() => navigate('/home')}>
          <i className="bi bi-person-walking exhibitor-to-participant__icon" />
          <span className="exhibitor-to-participant__label">
            参加者画面へ
            <small>ビンゴ・チェックイン・投票はこちら</small>
          </span>
          <i className="bi bi-chevron-right" />
        </button>

        {error ? (
          <div className="alert alert-danger d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill" />
            {error}
          </div>
        ) : null}

        {!data ? (
          <div className="exhibitor-state" style={{ minHeight: 'auto' }}>
            <p className="exhibitor-empty">読み込み中…</p>
          </div>
        ) : (
          <>
            <ExhibitorWindow title="ブース統計" icon="bi-clipboard-data">
              <div className="exhibitor-stats">
                <div className="exhibitor-stat">
                  <div className="exhibitor-stat__value">{data.total_checkins}</div>
                  <div className="exhibitor-stat__label">チェックイン総数</div>
                </div>
                <div className="exhibitor-stat">
                  <div className="exhibitor-stat__value">
                    {data.ratings.avg_rating !== null ? (
                      <>
                        <span className="exhibitor-star">★</span> {data.ratings.avg_rating.toFixed(1)}
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="exhibitor-stat__label">平均評価</div>
                </div>
                <div className="exhibitor-stat">
                  <div className="exhibitor-stat__value">{data.ratings.count}</div>
                  <div className="exhibitor-stat__label">評価件数</div>
                </div>
              </div>
            </ExhibitorWindow>

            <ExhibitorWindow title="時間帯別チェックイン" icon="bi-bar-chart">
              {data.hourly_checkins.length === 0 ? (
                <div className="exhibitor-empty-mascot">
                  <img src="/mascot/mascot-with-qr.png" alt="" />
                  <p className="exhibitor-empty">
                    まだチェックインがありません。
                    <br />
                    ブースの QR を見やすい場所に掲示しよう！
                  </p>
                </div>
              ) : (
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.hourly_checkins} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="time_slot" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar
                        isAnimationActive={false}
                        dataKey="count"
                        fill="var(--ex-sky-strong)"
                        radius={[4, 4, 0, 0]}
                        name="チェックイン数"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ExhibitorWindow>

            <ExhibitorWindow title="コメント一覧" icon="bi-chat-square-text">
              {sortedComments.length === 0 ? (
                <p className="exhibitor-empty">まだコメントがありません</p>
              ) : (
                <ul className="exhibitor-comments">
                  {sortedComments.map((c) => (
                    <li key={c.id} className="exhibitor-comment">
                      <div className="exhibitor-comment__meta">
                        <span className="exhibitor-star">
                          {starFillStates(c.rating).map((filled) => (filled ? '★' : '☆')).join('')}
                        </span>
                        <span>{new Date(c.rated_at).toLocaleString('ja-JP')}</span>
                      </div>
                      {c.comment ? <div className="exhibitor-comment__text">{c.comment}</div> : null}
                    </li>
                  ))}
                </ul>
              )}
            </ExhibitorWindow>
          </>
        )}
      </main>
    </div>
  )
}
