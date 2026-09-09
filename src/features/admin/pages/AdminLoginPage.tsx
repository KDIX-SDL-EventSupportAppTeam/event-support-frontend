import { FormEvent, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { resolveLoginEventId } from '@/features/auth/config/eventIds'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { isAdminUser, useAuthStore } from '@/shared/auth/authStore'
import { fetchPublicEvent, type PublicEvent } from '@/shared/api/publicEvent'

export function AdminLoginPage() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // ?event= クエリパラメータからイベント ID を取得（主催者ポータル発行の URL。
  // 存在すればそのイベント宛てにログインし、無ければ既定イベントにフォールバック）
  const queryEventId = searchParams.get('event') ?? ''
  // 実際にログインに使う event_id。?event= が無いときはビルド時に焼き込んだ既定イベント
  // （VITE_DEV_EVENT_ID）に解決される。**どちらの経路でも画面に出す。**
  // 出さないと、既定イベントが古いまま（例: 開発用のテストイベント）でも
  // 見た目は正常にログインでき、別イベントのデータを触っていることに気づけない
  const effectiveEventId = queryEventId || resolveLoginEventId()
  const usingFallback = !queryEventId

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // 公開イベント情報でイベント名・日程を表示。取得失敗時は UUID 表示にフォールバック
  const [publicEvent, setPublicEvent] = useState<PublicEvent | null>(null)
  const [eventLookupFailed, setEventLookupFailed] = useState(false)

  useEffect(() => {
    if (!effectiveEventId) return
    let active = true
    setPublicEvent(null)
    setEventLookupFailed(false)
    fetchPublicEvent(effectiveEventId)
      .then((e) => {
        if (active) setPublicEvent(e)
      })
      .catch(() => {
        // 見つからない = 既定イベントが消えている / ID が古い。導線は止めないが警告は出す
        if (active) setEventLookupFailed(true)
      })
    return () => {
      active = false
    }
  }, [effectiveEventId])

  if (token && isAdminUser(user)) return <Navigate to="/admin/menu" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await login(effectiveEventId, email, password)
      const current = useAuthStore.getState().user
      if (isAdminUser(current)) {
        navigate('/admin/menu', { replace: true })
      } else {
        useAuthStore.getState().clearSession()
        alert('運営権限がありません')
      }
    } catch {
      /* useAuth が error をセット */
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card p-4">
            <h1 className="h4 mb-3">運営ログイン</h1>
            <div
              className={`alert small mb-3 ${eventLookupFailed ? 'alert-danger' : 'alert-info'}`}
            >
              <i
                className={`bi me-1 ${eventLookupFailed ? 'bi-exclamation-triangle-fill' : 'bi-info-circle'}`}
              />
              {publicEvent ? (
                <>
                  イベント: <strong>{publicEvent.name}</strong>
                  <span className="text-muted ms-1">
                    （{new Date(publicEvent.date_start).toLocaleDateString('ja-JP')}）
                  </span>
                </>
              ) : eventLookupFailed ? (
                <>
                  <strong>このイベントが見つかりません。</strong>
                  <span className="d-block text-break">{effectiveEventId}</span>
                  <span className="d-block mt-1">
                    運営に配られた URL（<code>?event=</code> 付き）から開き直してください。
                  </span>
                </>
              ) : (
                <>
                  イベント: <strong className="text-break">{effectiveEventId}</strong>
                </>
              )}
              {usingFallback && !eventLookupFailed ? (
                <span className="d-block text-muted mt-1">
                  URL にイベントの指定がないため、アプリに設定された既定のイベントを使います。
                </span>
              ) : null}
            </div>
            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <label className="form-label">メールアドレス</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">パスワード</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error ? <p className="text-danger">{error}</p> : null}
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                ログイン
              </button>
            </form>
            <p className="mt-3 mb-0 text-center">
              <Link to="/login">参加者ログインへ</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
