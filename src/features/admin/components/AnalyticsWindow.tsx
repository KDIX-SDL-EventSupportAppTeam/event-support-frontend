type AnalyticsWindowProps = {
  title: string
  icon?: string
  minimized: boolean
  onToggleMinimize: () => void
  children: React.ReactNode
}

export function AnalyticsWindow({
  title,
  icon,
  minimized,
  onToggleMinimize,
  children,
}: AnalyticsWindowProps) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white d-flex align-items-center justify-content-between py-2">
        <span className="fw-semibold small">
          {icon ? <i className={`bi ${icon} me-1`} /> : null}
          {title}
        </span>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary py-0 px-2"
          onClick={onToggleMinimize}
          aria-label={minimized ? '展開' : '最小化'}
        >
          <i className={`bi ${minimized ? 'bi-chevron-down' : 'bi-chevron-up'}`} />
        </button>
      </div>
      {!minimized ? <div className="card-body">{children}</div> : null}
    </div>
  )
}
