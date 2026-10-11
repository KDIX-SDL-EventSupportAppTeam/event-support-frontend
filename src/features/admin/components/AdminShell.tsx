import { useCallback, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AdminSidebar } from '@/features/admin/components/AdminSidebar'
import { useAuthStore } from '@/shared/auth/authStore'
import { fetchAdminEventCached, useAdminMenuStore } from '@/features/admin/store/adminMenuStore'
import { eventStatus } from '@/shared/lib/eventStatus'

type AdminShellProps = {
  title?: string
  /** 開発者ツール配下の画面。本文の上に強い警告とハブへの戻り導線を出す */
  devTool?: boolean
  children: React.ReactNode
}

export function AdminShell({ title, devTool, children }: AdminShellProps) {
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
          {devTool ? (
            <div className="alert alert-danger d-flex align-items-start gap-2 mb-3" role="alert">
              <i className="bi bi-exclamation-octagon-fill fs-5" aria-hidden="true" />
              <div className="flex-grow-1">
                <strong>開発者向けの画面です。</strong>
                本番データを一括で作成・上書き・削除します。操作は取り消せません。
                内容を理解していない場合は操作しないでください。
              </div>
              <Link to="/admin/dev-tools" className="btn btn-sm btn-outline-danger flex-shrink-0">
                開発者ツールへ戻る
              </Link>
            </div>
          ) : null}
          {title && !isMenu ? <h1 className="h4 mb-4 fw-bold">{title}</h1> : null}
          {children}
        </div>
      </main>
    </div>
  )
}
