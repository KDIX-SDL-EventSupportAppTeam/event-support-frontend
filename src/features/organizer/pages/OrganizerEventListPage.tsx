import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listOrganizerEvents,
  type OrganizerEvent,
} from '@/features/organizer/api/organizerApi'
import { OrganizerShell } from '@/features/organizer/components/OrganizerShell'
import { CopyUrlButton } from '@/features/organizer/components/CopyUrlButton'
import { eventStatus, formatRemaining, type EventStatusKey } from '@/shared/lib/eventStatus'
import { formatClientError } from '@/shared/lib/formatClientError'

type Filter = 'all' | EventStatusKey

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'ongoing', label: '開催中' },
  { key: 'upcoming', label: '準備中' },
  { key: 'ended', label: '終了' },
]

export function OrganizerEventListPage() {
  const [events, setEvents] = useState<OrganizerEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setEvents(null)
    setError(null)
    listOrganizerEvents()
      .then((list) => {
        if (active) setEvents(list)
      })
      .catch((e) => {
        if (active) setError(formatClientError(e, 'イベント一覧の取得に失敗しました'))
      })
    return () => {
      active = false
    }
  }, [reloadKey])

  const filtered = useMemo(() => {
    if (!events) return []
    if (filter === 'all') return events
    return events.filter((e) => eventStatus(e.date_start, e.date_end).key === filter)
  }, [events, filter])

  return (
    <OrganizerShell>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 fw-bold mb-0">イベント一覧</h1>
        <Link to="/organizer/events/new" className="btn btn-primary btn-sm">
          <i className="bi bi-plus-lg me-1" />
          新規作成
        </Link>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center justify-content-between">
          <span>{error}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={() => setReloadKey((k) => k + 1)}>
            再試行
          </button>
        </div>
      ) : null}

      {!events && !error ? (
        <div className="text-center text-muted py-5">
          <div className="spinner-border" role="status" aria-hidden="true" />
          <div className="mt-2">読み込み中…</div>
        </div>
      ) : null}

      {events && events.length === 0 ? (
        <div className="text-center text-muted py-5">
          <i className="bi bi-calendar-plus display-4 d-block mb-3" />
          <p className="mb-3">まだイベントがありません。</p>
          <Link to="/organizer/events/new" className="btn btn-primary">
            最初のイベントを作成する
          </Link>
        </div>
      ) : null}

      {events && events.length > 0 ? (
        <>
          <div className="btn-group btn-group-sm mb-3" role="group" aria-label="開催ステータスフィルタ">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`btn ${filter === f.key ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="text-muted">この条件のイベントはありません。</p>
          ) : (
            <div className="row g-3">
              {filtered.map((ev) => (
                <div key={ev.id} className="col-12 col-md-6 col-xl-4">
                  <EventCard event={ev} />
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </OrganizerShell>
  )
}

function EventCard({ event }: { event: OrganizerEvent }) {
  const status = eventStatus(event.date_start, event.date_end)
  const remaining = status.key === 'ongoing' ? formatRemaining(event.date_start, event.date_end) : null

  return (
    <div className="card h-100 border-0 shadow-sm">
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className={`badge ${status.className}`}>{status.label}</span>
          {remaining ? <span className="text-muted small">{remaining}</span> : null}
        </div>

        <h2 className="h5 mb-2">
          <Link to={`/organizer/events/${event.id}`} className="text-decoration-none">
            {event.name}
          </Link>
        </h2>

        <div className="text-muted small mb-1">
          <i className="bi bi-calendar-event me-1" />
          {new Date(event.date_start).toLocaleString('ja-JP')} 〜{' '}
          {new Date(event.date_end).toLocaleString('ja-JP')}
        </div>
        <div className="text-muted small mb-3">
          <i className="bi bi-geo-alt me-1" />
          {event.venue || '会場未設定'}
        </div>

        <div className="d-flex gap-3 small mb-3">
          <span title="参加者">
            <i className="bi bi-people me-1" />
            {event.stats.participants}
          </span>
          <span title="ブース">
            <i className="bi bi-shop me-1" />
            {event.stats.booths}
          </span>
          <span title="チェックイン">
            <i className="bi bi-qr-code-scan me-1" />
            {event.stats.checkins}
          </span>
        </div>

        <div className="mt-auto d-flex flex-wrap gap-2">
          <Link to={`/organizer/events/${event.id}`} className="btn btn-sm btn-primary">
            詳細
          </Link>
          <CopyUrlButton text={event.urls.participant} label="参加者 URL" />
          <CopyUrlButton text={event.urls.admin} label="運営 URL" />
        </div>
      </div>
    </div>
  )
}
