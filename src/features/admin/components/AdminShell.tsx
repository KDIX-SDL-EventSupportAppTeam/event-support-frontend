import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'ダッシュボード', icon: 'bi-speedometer2' },
  { to: '/admin/booths', label: 'ブース', icon: 'bi-shop' },
  { to: '/admin/categories', label: 'カテゴリ', icon: 'bi-tags' },
  { to: '/admin/survey', label: 'アンケート', icon: 'bi-clipboard-check' },
  { to: '/admin/participants', label: '参加者', icon: 'bi-people' },
]

type AdminShellProps = {
  title: string
  children: React.ReactNode
}

export function AdminShell({ title, children }: AdminShellProps) {
  const clearSession = useAuthStore((s) => s.clearSession)
  const { pathname } = useLocation()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <nav className="navbar navbar-expand navbar-dark bg-dark px-3 py-2">
        <Link to="/admin/menu" className="navbar-brand fw-bold me-4" style={{ fontSize: '1rem' }}>
          <i className="bi bi-shield-check me-1" />
          運営管理
        </Link>
        <div className="navbar-nav d-none d-md-flex gap-1 me-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link px-2 py-1 rounded ${pathname === item.to ? 'active bg-white text-dark' : 'text-white-50'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <i className={`bi ${item.icon} me-1`} />
              {item.label}
            </Link>
          ))}
        </div>
        <button type="button" className="btn btn-outline-light btn-sm" onClick={clearSession}>
          <i className="bi bi-box-arrow-right me-1" />
          ログアウト
        </button>
      </nav>

      <div className="container-lg py-4">
        <h1 className="h4 mb-4 fw-bold">{title}</h1>
        {children}
      </div>
    </div>
  )
}
