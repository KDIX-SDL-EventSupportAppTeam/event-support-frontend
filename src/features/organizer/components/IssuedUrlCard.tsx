import { useState } from 'react'

type Props = {
  participantUrl: string
  adminUrl: string
  initialManagerEmail: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard API が使えない環境では何もしない */
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-secondary'}`}
      onClick={handleCopy}
      style={{ minWidth: 90 }}
    >
      {copied ? (
        <>
          <i className="bi bi-check-lg me-1" />
          コピー済み
        </>
      ) : (
        <>
          <i className="bi bi-clipboard me-1" />
          コピー
        </>
      )}
    </button>
  )
}

/**
 * イベント作成後に表示する発行 URL カード。
 * 参加者用 URL・管理者用 URL・初期マネージャーメールを表示する。
 */
export function IssuedUrlCard({ participantUrl, adminUrl, initialManagerEmail }: Props) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-success text-white fw-semibold">
        <i className="bi bi-check-circle me-2" />
        イベントを作成しました
      </div>
      <div className="card-body">
        <p className="text-muted small mb-3">
          以下の URL を参加者・スタッフに共有してください。
        </p>

        {/* 参加者用 URL */}
        <div className="mb-3">
          <label className="form-label fw-semibold">
            <i className="bi bi-person-fill me-1 text-primary" />
            参加者登録 URL
          </label>
          <div className="input-group">
            <input
              type="text"
              className="form-control form-control-sm bg-light"
              value={participantUrl}
              readOnly
            />
            <CopyButton text={participantUrl} />
          </div>
        </div>

        {/* 管理者用 URL */}
        <div className="mb-3">
          <label className="form-label fw-semibold">
            <i className="bi bi-shield-fill me-1 text-warning" />
            運営ログイン URL
          </label>
          <div className="input-group">
            <input
              type="text"
              className="form-control form-control-sm bg-light"
              value={adminUrl}
              readOnly
            />
            <CopyButton text={adminUrl} />
          </div>
        </div>

        {/* 初期マネージャー */}
        <div className="alert alert-warning small mb-0">
          <i className="bi bi-key me-1" />
          初期マネージャー: <strong>{initialManagerEmail}</strong>
        </div>
      </div>
    </div>
  )
}
