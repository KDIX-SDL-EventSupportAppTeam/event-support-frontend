import { useState } from 'react'

type Props = {
  participantUrl: string
  adminUrl: string
  /** 指定時のみ初期マネージャーの注記を表示する（作成直後の画面用）。 */
  initialManagerEmail?: string
  /** 'created' = イベント作成完了（既定）、'reissue' = 詳細画面での URL 再表示。 */
  variant?: 'created' | 'reissue'
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
export function IssuedUrlCard({
  participantUrl,
  adminUrl,
  initialManagerEmail,
  variant = 'created',
}: Props) {
  const isCreated = variant === 'created'
  return (
    <div className="card border-0 shadow-sm">
      <div
        className={`card-header text-white fw-semibold ${isCreated ? 'bg-success' : 'bg-primary'}`}
      >
        <i className={`bi ${isCreated ? 'bi-check-circle' : 'bi-link-45deg'} me-2`} />
        {isCreated ? 'イベントを作成しました' : '発行 URL'}
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

        {/* 初期マネージャー（作成直後のみ） */}
        {initialManagerEmail ? (
          <div className="alert alert-warning small mb-0">
            <i className="bi bi-key me-1" />
            初期マネージャー: <strong>{initialManagerEmail}</strong>
          </div>
        ) : null}
      </div>
    </div>
  )
}
