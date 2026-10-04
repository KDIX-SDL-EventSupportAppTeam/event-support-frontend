import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { resolveBoothByQrToken } from '@/shared/api/v1Participant'
import { ApiError, toApiError } from '@/shared/api/unwrap'

type State = { kind: 'loading' } | { kind: 'not_found' } | { kind: 'error' }

/**
 * `/c/:token` ── 掲示 QR（短縮 URL）の受け口（issue #168 / server#155）。
 *
 * 端末標準のカメラアプリで QR を読むとブラウザが毎回新しいタブを開く。これは Web 側から防げないので、
 * 「増えても壊れない」ようにここで受ける。トークンをブースへ解決し、**既存のチェックイン確認画面
 * （`/checkin?booth_id=`）へ `replace` で合流させる**。チェックインのロジックはここで複製しない。
 *
 * `RequireAuth` + `RequireAppOpen` の配下に置く（未ログインなら入口へ、未開放ならゲートが受け止める）。
 */
export function CheckInByTokenPage() {
  const { token = '' } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ kind: 'loading' })

  const resolve = useCallback(() => {
    let active = true
    setState({ kind: 'loading' })
    resolveBoothByQrToken(token)
      .then((booth) => {
        if (!active) return
        // /c/<token> を履歴に残さない（戻るボタンで解決が再実行されない）
        navigate(`/checkin?booth_id=${encodeURIComponent(booth.id)}`, { replace: true })
      })
      .catch((e: unknown) => {
        if (!active) return
        const err = toApiError(e)
        // 他イベント・無効ブース・存在しないトークンはサーバーがすべて 404 で返す
        setState(err instanceof ApiError && err.code === 'NOT_FOUND' ? { kind: 'not_found' } : { kind: 'error' })
      })
    return () => {
      active = false
    }
  }, [token, navigate])

  useEffect(() => resolve(), [resolve])

  if (state.kind === 'loading') {
    return (
      <div className="container py-5 text-center" data-testid="checkin-token-loading">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">ブースを確認しています</span>
        </div>
        <p className="mt-3 mb-0">ブースを確認しています…</p>
      </div>
    )
  }

  if (state.kind === 'not_found') {
    // ここでホームへ自動遷移しない（何が起きたか分からなくなる）
    return (
      <div className="container py-5 text-center" data-testid="checkin-token-not-found">
        <h2 className="result-title">このQRコードは、このイベントのブースではありません</h2>
        <div className="d-grid gap-2 mt-4">
          <Link className="btn btn-primary btn-lg" to="/checkin">
            QRを読み取る
          </Link>
          <Link className="btn btn-outline-secondary" to="/booth-list">
            ブース一覧から選ぶ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-5 text-center" data-testid="checkin-token-error">
      <h2 className="result-title">通信状況を確認してください</h2>
      <div className="d-grid gap-2 mt-4">
        <button type="button" className="btn btn-primary btn-lg" onClick={() => void resolve()}>
          もう一度試す
        </button>
        <Link className="btn btn-outline-secondary" to="/checkin">
          QRを読み取る
        </Link>
      </div>
    </div>
  )
}
