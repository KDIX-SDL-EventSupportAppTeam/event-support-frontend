import { useEffect, useRef, useState } from 'react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAuthStore } from '@/shared/auth/authStore'
import {
  fetchAdminBoothSummaries,
  fetchAdminBoothComments,
  type AdminBoothSort,
  type AdminBoothSummary,
  type AdminBoothComment,
} from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'

export function BoothCommentsPage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const [sort, setSort] = useState<AdminBoothSort>('checkin_count')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [booths, setBooths] = useState<AdminBoothSummary[] | null>(null)
  const [boothsError, setBoothsError] = useState<string | null>(null)
  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(null)
  const [comments, setComments] = useState<AdminBoothComment[]>([])
  const [commentsTotal, setCommentsTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  // 「もっと見る」の応答を適用する直前に、ブースが切り替わっていないか確認するための最新値
  const selectedBoothIdRef = useRef(selectedBoothId)
  selectedBoothIdRef.current = selectedBoothId

  useEffect(() => {
    if (!eventId) return
    let active = true
    setBooths(null)
    setBoothsError(null)
    fetchAdminBoothSummaries(eventId, { sort, order })
      .then((res) => {
        if (active) setBooths(res)
      })
      .catch((e) => {
        if (active) setBoothsError(formatClientError(e, 'ブース一覧の取得に失敗しました'))
      })
    return () => {
      active = false
    }
  }, [eventId, sort, order])

  useEffect(() => {
    if (!eventId || !selectedBoothId) return
    let active = true
    setComments([])
    setCommentsTotal(0)
    setHasMore(false)
    setCommentsError(null)
    setCommentsLoading(true)
    fetchAdminBoothComments(eventId, selectedBoothId, { offset: 0 })
      .then((res) => {
        if (!active) return
        setComments(res.comments)
        setHasMore(res.pagination.has_more)
        setCommentsTotal(res.pagination.total)
      })
      .catch((e) => {
        if (active) setCommentsError(formatClientError(e, 'コメントの取得に失敗しました'))
      })
      .finally(() => {
        if (active) setCommentsLoading(false)
      })
    return () => {
      active = false
    }
  }, [eventId, selectedBoothId])

  const selectedBooth = booths?.find((b) => b.id === selectedBoothId) ?? null

  const handleSortClick = (col: AdminBoothSort) => {
    if (sort === col) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSort(col)
    setOrder(col === 'name' ? 'asc' : 'desc')
  }

  const loadMore = async () => {
    if (!eventId || !selectedBoothId) return
    // 応答待ちの間にブースが切り替わったら結果を破棄するため、呼び出し時点のブースIDを捕捉する
    const boothIdAtRequest = selectedBoothId
    setCommentsLoading(true)
    setCommentsError(null)
    try {
      const res = await fetchAdminBoothComments(eventId, boothIdAtRequest, { offset: comments.length })
      if (selectedBoothIdRef.current !== boothIdAtRequest) return
      setComments((prev) => [...prev, ...res.comments])
      setHasMore(res.pagination.has_more)
      setCommentsTotal(res.pagination.total)
    } catch (e) {
      if (selectedBoothIdRef.current !== boothIdAtRequest) return
      setCommentsError(formatClientError(e, 'コメントの取得に失敗しました'))
    } finally {
      if (selectedBoothIdRef.current === boothIdAtRequest) setCommentsLoading(false)
    }
  }

  return (
    <AdminShell title="評価・コメント">
      <div className="row">
        <div className="col-12 col-lg-4 mb-3 mb-lg-0">
          {boothsError ? <div className="alert alert-danger">{boothsError}</div> : null}
          {!booths && !boothsError ? <p className="text-muted">読み込み中…</p> : null}
          {booths ? (
            <div className="card border-0 shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr className="small text-muted">
                      <SortableTh label="ブース名" col="name" sort={sort} order={order} onClick={handleSortClick} />
                      <SortableTh
                        label="チェックイン"
                        col="checkin_count"
                        sort={sort}
                        order={order}
                        onClick={handleSortClick}
                      />
                      <SortableTh
                        label="平均評価"
                        col="avg_rating"
                        sort={sort}
                        order={order}
                        onClick={handleSortClick}
                      />
                      <th className="text-end">コメント</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booths.map((b) => (
                      <tr
                        key={b.id}
                        className={selectedBoothId === b.id ? 'table-primary' : ''}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedBoothId(b.id)}
                      >
                        <td className="text-truncate" style={{ maxWidth: 160 }}>
                          {b.name}
                        </td>
                        <td className="text-end">{b.checkin_count}</td>
                        <td className="text-end">
                          {b.avg_rating != null ? (
                            <>
                              <i className="bi bi-star-fill text-warning me-1" style={{ fontSize: '0.7rem' }} />
                              {Number(b.avg_rating).toFixed(1)}
                            </>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-end">{b.comment_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        <div className="col-12 col-lg-8">
          {commentsError ? <div className="alert alert-danger">{commentsError}</div> : null}

          {!selectedBooth ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center text-muted py-5">
                <i className="bi bi-chat-left-text fs-1 d-block mb-2" />
                左の一覧からブースを選択してください
              </div>
            </div>
          ) : (
            <>
              <h2 className="h6 fw-bold">
                {selectedBooth.name} のコメント（{commentsTotal}件）
              </h2>

              {comments.length === 0 && !commentsLoading ? (
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center text-muted py-5">
                    このブースへのコメントはまだありません
                  </div>
                </div>
              ) : (
                comments.map((c) => <CommentCard key={c.id} comment={c} />)
              )}

              {hasMore ? (
                <div className="text-center mt-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    disabled={commentsLoading}
                    onClick={() => void loadMore()}
                  >
                    {commentsLoading ? '読み込み中…' : `もっと見る（残り${commentsTotal - comments.length}件）`}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </AdminShell>
  )
}

function CommentCard({ comment: c }: { comment: AdminBoothComment }) {
  return (
    <div className="card border-0 shadow-sm mb-2">
      <div className="card-body py-2 px-3">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="text-warning">
            {[1, 2, 3, 4, 5].map((n) => (
              <i key={n} className={`bi ${c.rating >= n ? 'bi-star-fill' : 'bi-star'}`} style={{ fontSize: '0.8rem' }} />
            ))}
          </span>
          <span className="small fw-semibold">{c.user_display_name ?? '（不明）'}</span>
          <span className="text-muted ms-auto" style={{ fontSize: '0.75rem' }}>
            {new Date(c.rated_at).toLocaleString('ja-JP')}
          </span>
        </div>
        <p className="mb-0 small" style={{ whiteSpace: 'pre-wrap' }}>
          {c.comment}
        </p>
      </div>
    </div>
  )
}

function SortableTh({
  label,
  col,
  sort,
  order,
  onClick,
}: {
  label: string
  col: AdminBoothSort
  sort: AdminBoothSort
  order: 'asc' | 'desc'
  onClick: (col: AdminBoothSort) => void
}) {
  const active = sort === col
  return (
    <th>
      <button
        type="button"
        className="btn btn-link p-0 text-decoration-none text-muted d-inline-flex align-items-center gap-1"
        onClick={() => onClick(col)}
      >
        {label}
        {active ? (
          <i className={`bi ${order === 'desc' ? 'bi-caret-down-fill' : 'bi-caret-up-fill'}`} />
        ) : null}
      </button>
    </th>
  )
}
