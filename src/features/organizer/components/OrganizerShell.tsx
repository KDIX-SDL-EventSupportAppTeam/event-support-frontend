import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useOrganizerStore } from '@/features/organizer/store/organizerStore'

type OrganizerShellProps = {
  children: React.ReactNode
}

/**
 * 主催者ポータル（一覧・作成・詳細）の共通レイアウト。
 * ヘッダーにタイトル・主催者名・ナビ・ログアウトを持つ。
 * 参加者/運営側の AdminShell は import しない（feature 間 import 禁止）。
 */
export function OrganizerShell({ children }: OrganizerShellProps) {
  const organizer = useOrganizerStore((s) => s.organizer)
  const clear = useOrganizerStore((s) => s.clear)
  const navigate = useNavigate()

  const onLogout = useCallback(() => {
    clear()
    navigate('/organizer/login', { replace: true })
  }, [clear, navigate])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--pf-cream-light)' }}>
      <header className="navbar navbar-expand bg-white border-bottom shadow-sm px-3 px-md-4">
        <Link to="/organizer/events" className="navbar-brand fw-bold text-primary">
          <i className="bi bi-calendar2-week me-2" />
          主催者ポータル
        </Link>
        <nav className="navbar-nav me-auto flex-row gap-3">
          <Link to="/organizer/events" className="nav-link">
            イベント一覧
          </Link>
          <Link to="/organizer/events/new" className="nav-link">
            新規作成
          </Link>
        </nav>
        <div className="d-flex align-items-center gap-3">
          {organizer ? (
            <span className="text-muted small d-none d-sm-inline">
              <i className="bi bi-person-circle me-1" />
              {organizer.display_name || organizer.email}
            </span>
          ) : null}
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onLogout}>
            <i className="bi bi-box-arrow-right me-1" />
            ログアウト
          </button>
        </div>
      </header>

      <main className="container py-4">{children}</main>
    </div>
  )
}
