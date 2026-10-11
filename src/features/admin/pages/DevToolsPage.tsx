import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { DEV_TOOL_PAGES } from '@/features/admin/config/windowRegistry'
import { isManagerUser, useAuthStore } from '@/shared/auth/authStore'

/**
 * 開発者ツールのハブ。一括登録・初期設定・データ編集をここに集約する。
 * 開くたびに確認チェックを求め、うっかり触れないようにする（確認状態は保存しない）。
 */
export function DevToolsPage() {
  const isManager = isManagerUser(useAuthStore((s) => s.user))
  const [acknowledged, setAcknowledged] = useState(false)

  if (!isManager) {
    return (
      <AdminShell title="開発者ツール">
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" />
          運営管理者権限が必要です
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell title="開発者ツール">
      <div className="card border-danger border-2 mb-4">
        <div className="card-body">
          <h2 className="h5 text-danger fw-bold">
            <i className="bi bi-exclamation-octagon-fill me-2" />
            開発者以外は操作しないでください
          </h2>
          <ul className="mb-3">
            <li>ここにある画面は、本番のイベントデータを一括で作成・上書き・削除します。</li>
            <li>操作は取り消せません。参加者・出展者の画面にすぐ反映されます。</li>
            <li>通常の運営作業（ブースの修正、アンケート・アワードの編集など）は左の各メニューから行ってください。</li>
          </ul>
          <div className="form-check">
            <input
              id="dev-tools-ack"
              type="checkbox"
              className="form-check-input"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            <label htmlFor="dev-tools-ack" className="form-check-label fw-semibold">
              内容を理解したうえで、開発者として操作します
            </label>
          </div>
        </div>
      </div>

      {acknowledged ? (
        <div className="row g-3">
          {DEV_TOOL_PAGES.map((page) => (
            <div key={page.to} className="col-md-6 col-xl-4">
              <Link to={page.to} className="card h-100 text-decoration-none text-reset shadow-sm">
                <div className="card-body">
                  <h3 className="h6 fw-bold">
                    <i className={`bi ${page.icon} me-2`} />
                    {page.label}
                  </h3>
                  <p className="small text-muted mb-0">{page.description}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </AdminShell>
  )
}
