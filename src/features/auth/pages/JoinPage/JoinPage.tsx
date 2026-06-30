import { FormEvent, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAuthStore } from '@/features/auth/store/authStore'
import {
  DEV_API_DISPLAY_NAME,
  resolveDevLoginEmail,
  resolveDevLoginPassword,
} from '@/features/auth/mocks/devDummyCredentials'

/**
 * /join/:eventId
 * イベント固有の参加者登録ページ。
 * eventId を URL から取得して登録フォームに事前入力する。
 */
export function JoinPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const token = useAuthStore((s) => s.token)
  const { register, loading, error } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState(resolveDevLoginEmail)
  const [password, setPassword] = useState(resolveDevLoginPassword)
  const [displayName, setDisplayName] = useState(
    () => import.meta.env.VITE_DEV_DISPLAY_NAME?.trim() || DEV_API_DISPLAY_NAME,
  )

  // イベント名は現時点では公開エンドポイントが未定義のため eventId をそのまま表示する
  const [eventLabel, setEventLabel] = useState<string | null>(null)

  useEffect(() => {
    // 将来的に GET /api/v1/events/:eventId などが実装された場合はここでフェッチする
    // 現時点では eventId を表示名として使用
    if (eventId) {
      setEventLabel(eventId)
    }
  }, [eventId])

  if (token) return <Navigate to="/home" replace />

  if (!eventId) {
    return (
      <div className="container mt-5 text-center">
        <p className="text-danger">イベント ID が指定されていません。</p>
        <Link to="/register">通常の登録ページへ</Link>
      </div>
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!eventId) return
    try {
      await register(eventId, email, password, displayName)
      navigate('/home', { replace: true })
    } catch {
      /* useAuth が error をセット */
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6">
          {/* イベントバナー */}
          {eventLabel && (
            <div className="alert alert-primary text-center mb-3">
              <i className="bi bi-calendar-event me-2" />
              <strong>{eventLabel}</strong> イベントに参加登録します
            </div>
          )}

          <div className="card p-4">
            <div className="card-body">
              <h1 className="card-title text-center mb-4">参加登録</h1>
              <form onSubmit={onSubmit}>
                {/* イベントID（表示専用） */}
                <div className="mb-3">
                  <label className="form-label">イベント ID</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={eventId}
                    readOnly
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="join-displayName" className="form-label">
                    表示名
                  </label>
                  <input
                    id="join-displayName"
                    type="text"
                    className="form-control"
                    value={displayName}
                    onChange={(ev) => setDisplayName(ev.target.value)}
                    required
                    maxLength={200}
                    autoComplete="name"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="join-email" className="form-label">
                    メールアドレス
                  </label>
                  <input
                    id="join-email"
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="join-password" className="form-label">
                    パスワード（8文字以上）
                  </label>
                  <input
                    id="join-password"
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                {error ? <p className="text-danger text-center">{error}</p> : null}
                <div className="d-grid mt-4">
                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? '登録中…' : '参加登録する'}
                  </button>
                </div>
              </form>
              <p className="text-center mt-4 mb-0">
                <Link to="/login">すでに登録済みの方はこちら</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
