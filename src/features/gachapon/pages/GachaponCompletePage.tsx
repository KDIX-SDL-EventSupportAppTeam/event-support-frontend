import { useNavigate, useLocation } from 'react-router-dom'
import {
  spendResultMessage,
  usedCoinLabel,
  type GachaSpendSummary,
} from '@/features/gachapon/lib/coinSpending'

/**
 * 使用済み画面。**参加者自身が確認するための画面**。
 * 「何枚目・何時何分・残り何枚」を出し、誤って使ったかどうかを本人が判断できるようにする（G-12）。
 * この画面へは履歴を置換して遷移してくるため、ブラウザバックで使用確認画面には戻れない。
 *
 * 複数枚使用（issue #150）に対応する。**表示は成立枚数に基づく**ので、
 * 一部しか成立しなかったときは「n枚使えました。残りm枚は使えませんでした。」と正直に出す。
 */
export function GachaponCompletePage() {
  const navigate = useNavigate()
  const state = useLocation().state as GachaSpendSummary | null

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
          src="/mascot/mascot-with-coin.png"
          alt=""
          className="gachapon-complete-mascot mb-3"
          decoding="async"
        />
        <h1 className="mb-3 h3">ガチャポンコイン使用済</h1>

        {state ? (
          <ul className="list-group list-group-flush mb-4 text-start">
            <li className="list-group-item d-flex justify-content-between">
              <span>使用した枚数</span>
              <strong>{spendResultMessage(state)}</strong>
            </li>
            <li className="list-group-item d-flex justify-content-between">
              <span>使用したコイン</span>
              <strong>{usedCoinLabel(state)}</strong>
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
