import { useState, type FormEvent } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { EntryLayout } from '@/features/entry/components/EntryLayout'
import { ApiError } from '@/shared/api/unwrap'

/**
 * S1 ── サインイン / サインアップ。
 *
 * 単一 URL の中で切り替えるため、画面遷移ではなくローカル state でモードを持つ。
 * 認証そのものは既存の `features/auth`（`POST /auth/register` / `/auth/login`）をそのまま使う。
 */
export function AuthStep({ eventId, onAuthenticated }: { eventId: string; onAuthenticated: () => void }) {
  const { login, register, loading, error } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  /** 登録済みメールでの登録試行など、エラーではなく案内として出すメッセージ */
  const [notice, setNotice] = useState<string | null>(null)

  const isSignUp = mode === 'signup'

  function switchMode(next: 'signin' | 'signup') {
    setMode(next)
    setNotice(null)
    setPassword('')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setNotice(null)
    try {
      if (isSignUp) await register(eventId, email, password, displayName)
      else await login(eventId, email, password)
      onAuthenticated()
    } catch (e) {
      // 登録済みのメールで登録しようとした場合（409）。この入口は初回・再訪の区別が
      // 付かないまま踏まれるため、失敗として突き放さずサインインへ引き継ぐ。
      if (isSignUp && e instanceof ApiError && e.code === 'CONFLICT') {
        setMode('signin')
        setPassword('')
        setNotice('このメールアドレスは登録済みです。パスワードを入力してサインインしてください。')
        return
      }
      // それ以外の表示は useAuth の error state に任せる
    }
  }

  return (
    <EntryLayout
      title={isSignUp ? 'アカウント作成' : 'サインイン'}
      subtitle={isSignUp ? 'イベント参加に使うアカウントを作成します' : '登録済みの方はこちら'}
    >
      <form onSubmit={onSubmit}>
        {isSignUp ? (
          <div className="mb-3">
            <label htmlFor="entry-name" className="form-label">
              お名前（表示名）
            </label>
            <input
              id="entry-name"
              type="text"
              className="form-control"
              value={displayName}
              onChange={(ev) => setDisplayName(ev.target.value)}
              required
              maxLength={200}
              autoComplete="name"
            />
          </div>
        ) : null}
        <div className="mb-3">
          <label htmlFor="entry-email" className="form-label">
            メールアドレス
          </label>
          <input
            id="entry-email"
            type="email"
            className="form-control"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="entry-password" className="form-label">
            {isSignUp ? 'パスワード（8 文字以上）' : 'パスワード'}
          </label>
          <input
            id="entry-password"
            type="password"
            className="form-control"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            minLength={isSignUp ? 8 : undefined}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
        </div>
        {notice ? <p className="text-center text-body-secondary">{notice}</p> : null}
        {error && !notice ? <p className="text-danger text-center">{error}</p> : null}
        <div className="d-grid mt-4">
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? '送信中…' : isSignUp ? '登録して次へ' : 'サインイン'}
          </button>
        </div>
      </form>
      <p className="text-center mt-4 mb-0">
        <button
          type="button"
          className="btn btn-link p-0"
          onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
        >
          {isSignUp ? 'すでに登録済みの方はこちら' : 'はじめての方はこちら'}
        </button>
      </p>
    </EntryLayout>
  )
}
