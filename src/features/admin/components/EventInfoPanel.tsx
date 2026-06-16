import { useEffect, useState } from 'react'
import { fetchAdminEvent, updateAdminEvent, type AdminEvent } from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'

function eventStatus(event: AdminEvent): { label: string; className: string } {
  const now = Date.now()
  const start = new Date(event.date_start).getTime()
  const end = new Date(event.date_end).getTime()
  if (now < start) return { label: '準備中', className: 'bg-secondary' }
  if (now <= end) return { label: '開催中', className: 'bg-success' }
  return { label: '終了', className: 'bg-dark' }
}

function formatRemaining(event: AdminEvent): string | null {
  const now = Date.now()
  const start = new Date(event.date_start).getTime()
  const end = new Date(event.date_end).getTime()
  if (now < start) {
    const mins = Math.floor((start - now) / 60000)
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `開始まで ${h}時間${m}分`
  }
  if (now <= end) {
    const mins = Math.floor((end - now) / 60000)
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `終了まで ${h}時間${m}分`
  }
  return null
}

type EventInfoPanelProps = {
  eventId: string
}

export function EventInfoPanel({ eventId }: EventInfoPanelProps) {
  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [editName, setEditName] = useState('')
  const [editVenue, setEditVenue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAdminEvent(eventId)
      .then((e) => {
        setEvent(e)
        setEditName(e.name)
        setEditVenue(e.venue ?? '')
      })
      .catch((e) => setError(formatClientError(e, 'イベント情報の取得に失敗しました')))
  }, [eventId])

  async function saveField(field: 'name' | 'venue', value: string) {
    if (!event) return
    setSaving(true)
    try {
      const updated = await updateAdminEvent(eventId, { [field]: value || null })
      setEvent(updated)
      setEditName(updated.name)
      setEditVenue(updated.venue ?? '')
    } catch (e) {
      setError(formatClientError(e, '更新に失敗しました'))
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return <div className="alert alert-danger mb-0">{error}</div>
  }

  if (!event) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body py-4 text-center text-muted">読み込み中…</div>
      </div>
    )
  }

  const status = eventStatus(event)
  const remaining = formatRemaining(event)

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-start gap-3 justify-content-between">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className={`badge ${status.className}`}>{status.label}</span>
              {remaining ? <span className="text-muted small">{remaining}</span> : null}
              {saving ? <span className="text-muted small">保存中…</span> : null}
            </div>
            <input
              className="form-control form-control-lg border-0 fw-bold px-0 mb-2"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => {
                if (event && editName !== event.name) void saveField('name', editName)
              }}
            />
            <div className="text-muted small mb-1">
              <i className="bi bi-calendar-event me-1" />
              {new Date(event.date_start).toLocaleString('ja-JP')} 〜{' '}
              {new Date(event.date_end).toLocaleString('ja-JP')}
            </div>
            <div className="d-flex align-items-center gap-1">
              <i className="bi bi-geo-alt text-muted" />
              <input
                className="form-control form-control-sm border-0 bg-transparent px-0"
                placeholder="会場を入力"
                value={editVenue}
                onChange={(e) => setEditVenue(e.target.value)}
                onBlur={() => {
                  if (event && editVenue !== (event.venue ?? '')) void saveField('venue', editVenue)
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
