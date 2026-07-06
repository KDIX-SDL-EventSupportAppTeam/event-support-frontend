import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AdminSidebar } from '@/features/admin/components/AdminSidebar'
import { useAuthStore } from '@/shared/auth/authStore'
import { fetchAdminEvent } from '@/shared/api/v1Admin'
import { eventStatus, type EventStatus } from '@/shared/lib/eventStatus'

type AdminShellProps = {
  title?: string
  children: React.ReactNode
}

export function AdminShell({ title, children }: AdminShellProps) {
  const clearSession = useAuthStore((s) => s.clearSession)
  const eventId = useAuthStore((s) => s.user?.event_id)
  const { pathname } = useLocation()
  const isMenu = pathname === '/admin/menu'
  const onLogout = useCallback(() => clearSession(), [clearSession])

  // イベント名・開催ステータスはサイドバー常時表示のため、ここで 1 回だけ取得する
  const [eventName, setEventName] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<EventStatus | null>(null)

  useEffect(() => {
    if (!eventId) return
    let active = true
    fetchAdminEvent(eventId)
      .then((e) => {
        if (!active) return
        setEventName(e.name)
        setStatus(eventStatus(e.date_start, e.date_end))
      })
      .catch(() => {
        /* 取得失敗時はイベント名なしで運用（サイドバーは表示され続ける） */
      })
    return () => {
      active = false
    }
  }, [eventId])

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <AdminSidebar onLogout={onLogout} eventName={eventName} status={status} />
      <main className="flex-grow-1 overflow-auto">
        <div className="p-4">
          {title && !isMenu ? <h1 className="h4 mb-4 fw-bold">{title}</h1> : null}
          {children}
        </div>
      </main>
    </div>
  )
}
