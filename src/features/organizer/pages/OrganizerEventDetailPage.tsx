import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getOrganizerEvent,
  type OrganizerEvent,
} from '@/features/organizer/api/organizerApi'
import { OrganizerShell } from '@/features/organizer/components/OrganizerShell'
import { IssuedUrlCard } from '@/features/organizer/components/IssuedUrlCard'
import { StaffList } from '@/features/organizer/components/StaffList'
import { eventStatus, formatRemaining } from '@/shared/lib/eventStatus'
import { formatClientError } from '@/shared/lib/formatClientError'

export function OrganizerEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [event, setEvent] = useState<OrganizerEvent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    if (!eventId) return
    let active = true
    setEvent(null)
    setError(null)
    setForbidden(false)
    getOrganizerEvent(eventId)
      .then((e) => {
        if (active) setEvent(e)
      })
      .catch((e: unknown) => {
        if (!active) return
        const status = (e as { response?: { status?: number } })?.response?.status
        if (status === 403) {
          setForbidden(true)
        } else {
          setError(formatClientError(e, 'イベントの取得に失敗しました'))
        }
      })
    return () => {
      active = false
    }
  }, [eventId])

  return (
    <OrganizerShell>
      <div className="mb-3">
        <Link to="/organizer/events" className="btn btn-sm btn-outline-secondary">
          <i className="bi bi-arrow-left me-1" />
          イベント一覧へ戻る
        </Link>
      </div>

      {forbidden ? (
        <div className="alert alert-warning">
          このイベントにはアクセスできません。
          <Link to="/organizer/events" className="alert-link ms-2">
            一覧へ戻る
          </Link>
        </div>
      ) : null}

      {error ? <div className="alert alert-danger">{error}</div> : null}

      {!event && !error && !forbidden ? <p className="text-muted">読み込み中…</p> : null}

      {event ? (
        <div className="d-flex flex-column gap-4">
          <EventOverview event={event} />
          <IssuedUrlCard
            participantUrl={event.urls.participant}
            adminUrl={event.urls.admin}
            variant="reissue"
          />
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <StaffList eventId={event.id} />
            </div>
          </div>
        </div>
      ) : null}
    </OrganizerShell>
  )
}

function EventOverview({ event }: { event: OrganizerEvent }) {
  const status = eventStatus(event.date_start, event.date_end)
  const remaining = formatRemaining(event.date_start, event.date_end)

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className={`badge ${status.className}`}>{status.label}</span>
          {remaining ? <span className="text-muted small">{remaining}</span> : null}
        </div>
        <h1 className="h4 fw-bold mb-2">{event.name}</h1>
        <div className="text-muted small mb-1">
          <i className="bi bi-calendar-event me-1" />
          {new Date(event.date_start).toLocaleString('ja-JP')} 〜{' '}
          {new Date(event.date_end).toLocaleString('ja-JP')}
        </div>
        <div className="text-muted small mb-1">
          <i className="bi bi-geo-alt me-1" />
          {event.venue || '会場未設定'}
        </div>
        <div className="text-muted small mb-1">
          <i className="bi bi-link-45deg me-1" />
          {event.survey_url ?? 'アンケート未設定'}
        </div>
        <div className="text-muted small mb-3">
          <i className="bi bi-clock me-1" />
          作成日: {new Date(event.created_at).toLocaleString('ja-JP')}
        </div>

        <div className="d-flex gap-4 mb-3">
          <Stat icon="bi-people" label="参加者" value={event.stats.participants} />
          <Stat icon="bi-shop" label="ブース" value={event.stats.booths} />
          <Stat icon="bi-qr-code-scan" label="チェックイン" value={event.stats.checkins} />
        </div>

        <p className="text-muted small mb-0">
          <i className="bi bi-info-circle me-1" />
          イベント情報の編集は運営画面（運営 URL）から行えます。
        </p>
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="h4 mb-0">
        <i className={`bi ${icon} me-1 text-primary`} />
        {value}
      </div>
      <div className="text-muted small">{label}</div>
    </div>
  )
}
