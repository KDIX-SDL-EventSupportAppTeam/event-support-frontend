import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { AdminSidebar } from '@/features/admin/components/AdminSidebar'
import { useAuthStore } from '@/features/auth/store/authStore'

type AdminShellProps = {
  title?: string
  children: React.ReactNode
}

export function AdminShell({ title, children }: AdminShellProps) {
  const clearSession = useAuthStore((s) => s.clearSession)
  const { pathname } = useLocation()
  const isMenu = pathname === '/admin/menu'
  const onLogout = useCallback(() => clearSession(), [clearSession])

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <AdminSidebar onLogout={onLogout} />
      <main className="flex-grow-1 overflow-auto">
        <div className="p-4">
          {title && !isMenu ? <h1 className="h4 mb-4 fw-bold">{title}</h1> : null}
          {children}
        </div>
      </main>
    </div>
  )
}
