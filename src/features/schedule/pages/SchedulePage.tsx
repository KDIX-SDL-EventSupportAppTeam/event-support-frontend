import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createParticipantClient } from '@/shared/data/createParticipantClient'
import type { ScheduleDay } from '@/shared/types/eventContent'

export function SchedulePage() {
  const navigate = useNavigate()
  const [days, setDays] = useState<ScheduleDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = createParticipantClient()
    ;(async () => {
      try {
        const d = await client.getSchedule()
        setDays(d)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="schedule-page container">
      <h1 className="main-title">タイムスケジュール</h1>
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        days.map((day) => (
          <div key={day.dayTitle} className="day-container">
            <h2 className="day-title">{day.dayTitle}</h2>
            {day.events.length === 0 ? (
              <p className="text-muted schedule-empty">タイムテーブルは会場の掲示・アナウンスをご覧ください。</p>
            ) : (
              <ul className="schedule-list">
                {day.events.map((ev, index) => (
                  <li key={`${ev.time}-${ev.title}`} className={`schedule-item ${index % 2 === 0 ? 'bg-yellow' : 'bg-red'}`}>
                    <div className="time-bar" aria-hidden />
                    <span className="time">{ev.time}</span>
                    <span className="event-title">{ev.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
      <div className="footer">
        <button type="button" className="checkin-home-button" onClick={() => navigate('/home')}>
          ホームに戻る
        </button>
      </div>
    </div>
  )
}
