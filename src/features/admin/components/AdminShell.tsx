import { useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AdminSidebar } from '@/features/admin/components/AdminSidebar'
import { useAuthStore } from '@/shared/auth/authStore'
import { fetchAdminEventCached, useAdminMenuStore } from '@/features/admin/store/adminMenuStore'
import { eventStatus } from '@/shared/lib/eventStatus'

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

  // イベント名・開催ステータスはサイドバー常時表示のため adminMenuStore のキャッシュを使う。
  // 同一 eventId の間はページを行き来しても再フェッチしない（FE-R2）
  const cachedEvent = useAdminMenuStore((s) => s.cachedEvent)

  useEffect(() => {
    if (!eventId) return
    fetchAdminEventCached(eventId).catch(() => {
      /* 取得失敗時はイベント名なしで運用（サイドバーは表示され続ける） */
    })
  }, [eventId])

  const current = cachedEvent && cachedEvent.id === eventId ? cachedEvent : null
  // 開催ステータスはキャッシュした日時から表示のたびに導出する
  const status = current ? eventStatus(current.date_start, current.date_end) : null

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: 'var(--pf-cream-light)' }}>
      <AdminSidebar onLogout={onLogout} eventName={current?.name} status={status} />
      <main className="flex-grow-1 overflow-auto">
        <div className="p-4">
          {title && !isMenu ? <h1 className="h4 mb-4 fw-bold">{title}</h1> : null}
          {children}
        </div>
      </main>
    </div>
  )
}
