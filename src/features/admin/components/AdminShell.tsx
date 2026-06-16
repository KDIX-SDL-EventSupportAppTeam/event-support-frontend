import { Link } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'

type AdminShellProps = {
  title: string
  children: React.ReactNode
}

export function AdminShell({ title, children }: AdminShellProps) {
  const clearSession = useAuthStore((s) => s.clearSession)

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">{title}</h1>
          <Link to="/admin/menu" className="small">
            ← 運営メニュー
          </Link>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/menu" className="btn btn-outline-secondary btn-sm">
            メニュー
          </Link>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={clearSession}>
            ログアウト
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}
