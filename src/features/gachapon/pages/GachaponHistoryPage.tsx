import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/shared/auth/authStore'
import { createGachaClient, type GachaHistory } from '@/features/gachapon/api/gachaClient'
import { useNow } from '@/features/gachapon/hooks/useNow'
import {
  coinNumberLabel,
  formatJstHm,
  formatJstHms,
  groupCoinUses,
} from '@/features/gachapon/lib/coinHistory'

/**
 * コインが 0 枚のときの使用履歴（領収書）画面。
 * ライン数とコインの対応がずれた参加者が運営に申し出たとき、スタッフがその場で状況を確認する。
 *
 * - アカウント（メールアドレス）は全文を出す（本人の特定。マスクしない）
 * - 現在時刻は秒まで出して 1 秒ごとに更新する（スクリーンショットの使い回しを見分ける）
 * - 数値はサーバーの値をそのまま出す（フロントで計算しない）
 * - 履歴は 10 秒以内の連続を 1 回の使用にまとめる（groupCoinUses）
 */
export function GachaponHistoryPage() {
  const navigate = useNavigate()
  const eventId = useAuthStore((s) => s.user?.event_id)
  const userId = useAuthStore((s) => s.user?.id)
  const now = useNow(1000)

  const [history, setHistory] = useState<GachaHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!eventId || !userId) {
      setLoading(false)
      return
    }
    let alive = true
    createGachaClient()
      .getHistory(eventId, userId)
      .then((h) => {
        if (alive) setHistory(h)
      })
      .catch(() => {
        if (alive) setErrorMessage('使用履歴の取得に失敗しました。通信環境をご確認ください。')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [eventId, userId])

  const homeButton = (
    <div className="d-grid">
      <button
        type="button"
        className="btn btn-primary btn-back"
        onClick={() => navigate('/home', { replace: true })}
      >
        ホームに戻る
      </button>
    </div>
  )

  return (
    <div className="gachapon-container">
      <div className="card p-4 text-center">
        {loading ? (
          <div className="py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">読み込み中</span>
            </div>
          </div>
        ) : !history ? (
          <>
            <p className="lead text-danger">{errorMessage || '使用履歴を表示できませんでした。'}</p>
            {homeButton}
          </>
        ) : (
          <>
            {history.available > 0 ? (
              <>
                <h1 className="mb-2 h3">コインが残っています</h1>
                <div className="d-grid mb-4">
                  <button
                    type="button"
                    className="btn btn-primary btn-proceed"
                    onClick={() => navigate('/gachapon')}
                  >
                    ガチャポンに進む
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="mb-2 h3">使用できるコインがありません</h1>
                <p className="text-muted mb-4">ビンゴのラインを増やすとコインがたまります。</p>
              </>
            )}

            <ul className="list-group list-group-flush mb-4 text-start">
              <li className="list-group-item d-flex justify-content-between gap-3">
                <span>アカウント</span>
                <strong className="text-break text-end">{history.email}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>現在時刻</span>
                <strong>{formatJstHms(now)}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>成立ライン数</span>
                <strong>{history.lines_completed}本</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>獲得枚数</span>
                <strong>{history.earned}枚</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>使用済み枚数</span>
                <strong>{history.used}枚</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>残り枚数</span>
                <strong>{history.available}枚</strong>
              </li>
              <li className="list-group-item">
                <div className="mb-1">使用履歴</div>
                <UseGroups history={history} />
              </li>
            </ul>

            {homeButton}
          </>
        )}
      </div>
    </div>
  )
}

function UseGroups({ history }: { history: GachaHistory }) {
  const groups = groupCoinUses(history.uses)
  if (groups.length === 0) return <p className="text-muted mb-0">まだ使用していません</p>
  return (
    <ul className="list-unstyled mb-0">
      {groups.map((g) => (
        <li key={g.firstNumber} className="d-flex justify-content-between">
          <span>
            {g.count}枚使用（{coinNumberLabel(g)}）
          </span>
          <strong>{formatJstHm(g.usedAt)}</strong>
        </li>
      ))}
    </ul>
  )
}
