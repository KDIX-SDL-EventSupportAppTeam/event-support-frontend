import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/shared/auth/authStore'
import { ApiError, toApiError } from '@/shared/api/unwrap'
import {
  createGachaClient,
  GACHA_DISABLED,
  NO_COINS_AVAILABLE,
  type GachaCoins,
} from '@/features/gachapon/api/gachaClient'

/**
 * 使用確認画面。GET で枚数を出し、確定で1枚 POST する。
 *
 * - 冪等キーはこの画面のマウント時に1個だけ生成し、リトライでも同じ値を使う（G-5）
 * - 確認は1段のみ（二重確認モーダルは重ねない）
 * - 「使用する」は押下直後に disabled にし、ラベルを「使用中…」に変える
 * - 残り0枚のときは使用ボタンを表示しない（disabled ではなく非表示）
 * - 完了画面へは履歴を置換して遷移する（完了画面から戻ってこられないようにする）
 */
export function GachaponUsePage() {
  const navigate = useNavigate()
  const eventId = useAuthStore((s) => s.user?.event_id)
  const userId = useAuthStore((s) => s.user?.id)

  // マウント時に1個だけ生成。再試行でも使い回す。
  const [idempotencyKey] = useState(() => crypto.randomUUID())

  const [coins, setCoins] = useState<GachaCoins | null>(null)
  const [loading, setLoading] = useState(true)
  const [using, setUsing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const client = createGachaClient()

  const reload = useCallback(async () => {
    if (!eventId || !userId) {
      setLoading(false)
      return
    }
    try {
      setCoins(await client.getCoins(eventId, userId))
    } catch {
      setErrorMessage('コイン情報の取得に失敗しました。通信環境をご確認ください。')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, userId])

  useEffect(() => {
    void reload()
  }, [reload])

  async function onUse() {
    if (!eventId || !userId || using) return
    setUsing(true) // 押下直後に disabled
    setErrorMessage('')
    try {
      const result = await client.useCoin(eventId, userId, idempotencyKey)
      // 履歴を置換して遷移する（完了画面から使用確認へ戻れない）
      navigate('/gachapon/complete', { replace: true, state: result })
    } catch (e) {
      const err = toApiError(e)
      if (err instanceof ApiError && err.code === NO_COINS_AVAILABLE) {
        setErrorMessage(
          '他の端末で使い切った可能性があります。最新の枚数を取り直しました。',
        )
        setUsing(false)
        await reload()
        return
      }
      if (err instanceof ApiError && err.code === GACHA_DISABLED) {
        setCoins((c) => (c ? { ...c, is_enabled: false } : c))
        setUsing(false)
        return
      }
      setErrorMessage('コインの使用に失敗しました。もう一度お試しください。')
      setUsing(false) // 同じ冪等キーで再試行できる
    }
  }

  const backButton = (
    <button
      type="button"
      className="btn btn-secondary btn-back"
      onClick={() => navigate('/gachapon')}
    >
      もどる
    </button>
  )

  return (
    <div className="gachapon-container">
      <div className="card p-4 text-center">
        <h2 className="mb-3">コインを使用しますか？</h2>

        {loading ? (
          <div className="py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">読み込み中</span>
            </div>
          </div>
        ) : !coins ? (
          <>
            <p className="lead text-danger">{errorMessage || 'コイン情報を表示できませんでした。'}</p>
            <div className="d-grid">{backButton}</div>
          </>
        ) : !coins.is_enabled ? (
          <>
            <p className="lead">ただいまガチャポンは準備中です。</p>
            <p className="text-muted">しばらくたってからもう一度お試しください。</p>
            <div className="d-grid">{backButton}</div>
          </>
        ) : coins.available <= 0 ? (
          <>
            <p className="lead">使用できるコインがありません。</p>
            <p className="text-muted">ビンゴのラインを増やすとコインがたまります。</p>
            {/* 残り0枚では使用ボタンを「表示しない」（非表示） */}
            <div className="d-grid">{backButton}</div>
          </>
        ) : (
          <>
            <p className="lead">所持コイン数: {coins.available}枚</p>
            <div className="coins-display my-4">
              {Array.from({ length: coins.available }).map((_, i) => (
                <img key={i} src="/gacha/coin.png" alt="" />
              ))}
            </div>
            <p className="text-muted small mb-3">
              「使用する」を押すと、その場でコインが1枚消費されます（取り消せません）。
            </p>
            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-danger btn-proceed"
                disabled={using}
                onClick={() => void onUse()}
              >
                {using ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                      aria-hidden
                    />
                    使用中…
                  </>
                ) : (
                  '使用する'
                )}
              </button>
              {backButton}
            </div>
          </>
        )}

        {errorMessage && coins ? (
          <p className="text-danger mt-3 mb-0" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  )
}
