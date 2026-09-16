import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  clearOrganizerEventData,
  getOrganizerEvent,
  updateOrganizerEvent,
  type OrganizerEvent,
} from '@/features/organizer/api/organizerApi'
import { OrganizerShell } from '@/features/organizer/components/OrganizerShell'
import { IssuedUrlCard } from '@/features/organizer/components/IssuedUrlCard'
import { StaffList } from '@/features/organizer/components/StaffList'
import { EventDataClearSection } from '@/features/organizer/components/EventDataClearSection'
import { eventStatus, formatRemaining } from '@/shared/lib/eventStatus'
import { formatClientError } from '@/shared/lib/formatClientError'

export function OrganizerEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [event, setEvent] = useState<OrganizerEvent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const requestIdRef = useRef(0)

  const reload = useCallback(() => {
    if (!eventId) return Promise.resolve()
    const requestId = ++requestIdRef.current
    setError(null)
    setForbidden(false)
    return getOrganizerEvent(eventId)
      .then((e) => {
        if (requestIdRef.current !== requestId) return
        setEvent(e)
      })
      .catch((e: unknown) => {
        if (requestIdRef.current !== requestId) return
        const status = (e as { response?: { status?: number } })?.response?.status
        if (status === 403) {
          setForbidden(true)
        } else {
          setError(formatClientError(e, 'イベントの取得に失敗しました'))
        }
      })
  }, [eventId])

  useEffect(() => {
    if (!eventId) return
    setEvent(null)
    void reload()
  }, [eventId, reload])

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
          <EventOverview event={event} onUpdated={setEvent} />
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
          <EventDataClearSection
            onClear={() => clearOrganizerEventData(event.id)}
            onCleared={() => {
              void reload()
            }}
          />
        </div>
      ) : null}
    </OrganizerShell>
  )
}

/** ISO 8601 → `<input type="datetime-local">` の値（端末のローカル時刻） */
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type EditForm = {
  name: string
  dateStart: string
  dateEnd: string
  venue: string
  surveyUrl: string
}

function toEditForm(event: OrganizerEvent): EditForm {
  return {
    name: event.name,
    dateStart: toLocalInput(event.date_start),
    dateEnd: toLocalInput(event.date_end),
    venue: event.venue ?? '',
    surveyUrl: event.survey_url ?? '',
  }
}

function EventOverview({
  event,
  onUpdated,
}: {
  event: OrganizerEvent
  onUpdated: (event: OrganizerEvent) => void
}) {
  const status = eventStatus(event.date_start, event.date_end)
  const remaining = formatRemaining(event.date_start, event.date_end)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EditForm>(() => toEditForm(event))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function startEdit() {
    setForm(toEditForm(event))
    setSaveError(null)
    setEditing(true)
  }

  function update<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    const name = form.name.trim()
    const surveyUrl = form.surveyUrl.trim()
    const start = new Date(form.dateStart)
    const end = new Date(form.dateEnd)
    if (!name) {
      setSaveError('イベント名は必須です')
      return
    }
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setSaveError('開始・終了日時を入力してください')
      return
    }
    if (start.getTime() >= end.getTime()) {
      setSaveError('終了日時は開始日時より後にしてください')
      return
    }
    if (surveyUrl && !/^https?:\/\//.test(surveyUrl)) {
      setSaveError('アンケートURLは http(s):// で始めてください')
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      const updated = await updateOrganizerEvent(event.id, {
        name,
        date_start: start.toISOString(),
        date_end: end.toISOString(),
        venue: form.venue.trim() || null,
        survey_url: surveyUrl || null,
      })
      onUpdated(updated)
      setEditing(false)
    } catch (err) {
      setSaveError(formatClientError(err, 'イベント情報の保存に失敗しました'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className={`badge ${status.className}`}>{status.label}</span>
          {remaining ? <span className="text-muted small">{remaining}</span> : null}
          {!editing ? (
            <button type="button" className="btn btn-sm btn-outline-primary ms-auto" onClick={startEdit}>
              <i className="bi bi-pencil me-1" />
              編集
            </button>
          ) : null}
        </div>

        {editing ? (
          <form onSubmit={(e) => void onSave(e)} className="mb-3">
            {saveError ? <div className="alert alert-danger py-2 small">{saveError}</div> : null}
            <div className="mb-2">
              <label className="form-label small fw-bold" htmlFor="edit-name">
                イベント名
              </label>
              <input
                id="edit-name"
                className="form-control"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                maxLength={255}
                required
              />
            </div>
            <div className="row g-2 mb-2">
              <div className="col-sm-6">
                <label className="form-label small fw-bold" htmlFor="edit-start">
                  開始日時
                </label>
                <input
                  id="edit-start"
                  type="datetime-local"
                  className="form-control"
                  value={form.dateStart}
                  onChange={(e) => update('dateStart', e.target.value)}
                  required
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label small fw-bold" htmlFor="edit-end">
                  終了日時
                </label>
                <input
                  id="edit-end"
                  type="datetime-local"
                  className="form-control"
                  value={form.dateEnd}
                  onChange={(e) => update('dateEnd', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="mb-2">
              <label className="form-label small fw-bold" htmlFor="edit-venue">
                会場
              </label>
              <input
                id="edit-venue"
                className="form-control"
                value={form.venue}
                onChange={(e) => update('venue', e.target.value)}
                maxLength={500}
                placeholder="未設定"
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold" htmlFor="edit-survey">
                アンケートURL
              </label>
              <input
                id="edit-survey"
                className="form-control"
                value={form.surveyUrl}
                onChange={(e) => update('surveyUrl', e.target.value)}
                placeholder="https://forms.gle/xxxx"
              />
            </div>
            <p className="text-muted small">
              日時を変えても、アプリの公開状態（運営画面の開放スイッチ）は変わりません。
            </p>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '保存中…' : '保存'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                キャンセル
              </button>
            </div>
          </form>
        ) : (
          <>
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
          </>
        )}

        <div className="text-muted small mb-3">
          <i className="bi bi-clock me-1" />
          作成日: {new Date(event.created_at).toLocaleString('ja-JP')}
        </div>

        <div className="d-flex gap-4">
          <Stat icon="bi-people" label="参加者" value={event.stats.participants} />
          <Stat icon="bi-shop" label="ブース" value={event.stats.booths} />
          <Stat icon="bi-qr-code-scan" label="チェックイン" value={event.stats.checkins} />
        </div>
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
