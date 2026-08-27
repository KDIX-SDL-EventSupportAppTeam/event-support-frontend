import { useNavigate, useLocation } from 'react-router-dom'
import type { GachaUseResult } from '@/features/gachapon/api/gachaClient'

/**
 * 使用済み画面。**参加者自身が確認するための画面**。
 * 「何枚目・何時何分・残り何枚」を出し、誤って使ったかどうかを本人が判断できるようにする（G-12）。
 * この画面へは履歴を置換して遷移してくるため、ブラウザバックで使用確認画面には戻れない。
 */
export function GachaponCompletePage() {
  const navigate = useNavigate()
  const state = useLocation().state as GachaUseResult | null

  function formatTime(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}時${mm}分`
  }

  return (
    <div className="gachapon-container">
      <div className="card p-4 text-center">
        <img
          src="/brand/logo-protofes.png"
          alt="ProtoFes"
          className="logo mb-4 pf-logo"
          style={{ width: 150 }}
        />
        <h1 className="mb-3 h3">ガチャポンコイン使用済</h1>

        {state ? (
          <ul className="list-group list-group-flush mb-4 text-start">
            <li className="list-group-item d-flex justify-content-between">
              <span>使用したコイン</span>
              <strong>{state.coin_index + 1}枚目</strong>
            </li>
            <li className="list-group-item d-flex justify-content-between">
              <span>使用時刻</span>
              <strong>{formatTime(state.used_at)}</strong>
            </li>
            <li className="list-group-item d-flex justify-content-between">
              <span>残りのコイン</span>
              <strong>{state.available}枚</strong>
            </li>
          </ul>
        ) : (
          <p className="lead mb-4">コインを1枚使用しました。</p>
        )}

        <p className="text-muted mb-4">
          ガチャポン筐体でお楽しみください。プロトフェスを引き続きお楽しみください。
        </p>
        <div className="d-grid">
          <button
            type="button"
            className="btn btn-primary btn-back"
            onClick={() => navigate('/home', { replace: true })}
          >
            ホームに戻る
          </button>
        </div>
      </div>
    </div>
  )
}
