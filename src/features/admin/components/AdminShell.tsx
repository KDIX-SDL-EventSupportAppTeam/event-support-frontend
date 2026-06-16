import { Link, useLocation } from 'react-router-dom'
import { FULL_PAGE_NAV, WINDOW_REGISTRY } from '@/features/admin/config/windowRegistry'
import { useAdminMenuStore } from '@/features/admin/store/adminMenuStore'
import { useAuthStore } from '@/features/auth/store/authStore'

type AdminShellProps = {
  title?: string
  children: React.ReactNode
}

export function AdminShell({ title, children }: AdminShellProps) {
  const clearSession = useAuthStore((s) => s.clearSession)
  const eventName = useAuthStore((s) => s.user?.display_name)
  const { pathname } = useLocation()
  const visibleWindows = useAdminMenuStore((s) => s.visibleWindows)
  const toggleWindow = useAdminMenuStore((s) => s.toggleWindow)
  const isMenu = pathname === '/admin/menu'

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <aside
        className="bg-dark text-white d-flex flex-column flex-shrink-0"
        style={{ width: 220, minHeight: '100vh' }}
      >
        <div className="p-3 border-bottom border-secondary">
          <Link to="/admin/menu" className="text-white text-decoration-none fw-bold d-block">
            <i className="bi bi-shield-check me-1" />
            運営管理
          </Link>
          {eventName ? (
            <div className="text-white-50 small mt-1 text-truncate">{eventName}</div>
          ) : null}
        </div>

        <nav className="flex-grow-1 overflow-auto py-2">
          <div className="px-3 py-1 text-white-50 small text-uppercase">フルページ</div>
          {FULL_PAGE_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`d-flex align-items-center gap-2 px-3 py-2 text-decoration-none ${
                pathname === item.to ? 'bg-white text-dark' : 'text-white-50'
              }`}
              style={{ fontSize: '0.85rem' }}
            >
              <i className={`bi ${item.icon}`} />
              {item.label}
            </Link>
          ))}

          <div className="px-3 py-1 mt-2 text-white-50 small text-uppercase">ウィンドウ</div>
          {WINDOW_REGISTRY.map((item) => (
            <label
              key={item.key}
              className="d-flex align-items-center gap-2 px-3 py-2 text-white-50"
              style={{ fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                className="form-check-input mt-0"
                checked={visibleWindows.includes(item.key)}
                onChange={() => toggleWindow(item.key)}
              />
              <i className={`bi ${item.icon}`} />
              {item.label}
            </label>
          ))}
        </nav>

        <div className="p-3 border-top border-secondary">
          <button type="button" className="btn btn-outline-light btn-sm w-100" onClick={clearSession}>
            <i className="bi bi-box-arrow-right me-1" />
            ログアウト
          </button>
        </div>
      </aside>

      <main className="flex-grow-1 overflow-auto">
        <div className="p-4">
          {title && !isMenu ? <h1 className="h4 mb-4 fw-bold">{title}</h1> : null}
          {children}
        </div>
      </main>
    </div>
  )
}
