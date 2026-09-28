import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/shared/auth/authStore'
import { ApiError, toApiError } from '@/shared/api/unwrap'
import {
  createGachaClient,
  GACHA_DISABLED,
  type GachaCoins,
} from '@/features/gachapon/api/gachaClient'
import { buildIdempotencyKeys, clampCoinCount, spendCoins } from '@/features/gachapon/lib/coinSpending'

/**
 * 使用確認画面。GET で枚数を出し、確定で**指定枚数ぶん**1枚消費 API を逐次 POST する（issue #150）。
 *
 * - 枚数はステッパー（`− n +`）で選ぶ。**手動入力は採らない**（上限4枚で桁を意識させる意味が無い）
 * - 上限は**サーバーが返した `coins.available`**。`MAX_GACHAPON_COINS` をここの判定に使わない
 * - `available` が1枚のときはステッパーを出さず、従来どおりの1枚フロー
 * - 冪等キーは枚数ぶん別に持つ（**1枚につき1個の UUID**。サーバーが UUID 形式で検証する）。
 *   キー列は状態として保持し、同じ枚数の再試行では同じ列を送る。**枚数を変えたら作り直す**（G-5）
 * - 確認は1段のみ（二重確認モーダルは重ねない）
 * - 「n枚使う」は押下直後に disabled にし、ラベルを「使用中…」に変える
 * - 残り0枚のときは使用ボタンを表示しない（disabled ではなく非表示）
 * - 完了画面へは履歴を置換して遷移する（完了画面から戻ってこられないようにする）
 */
export function GachaponUsePage() {
  const navigate = useNavigate()
  const eventId = useAuthStore((s) => s.user?.event_id)
  const userId = useAuthStore((s) => s.user?.id)

  // 冪等キー列（1枚 = 1 UUID）。同じ枚数での再試行では使い回し、
  // **枚数を変えたら作り直す**（別の操作として扱う）。
  const [idempotencyKeys, setIdempotencyKeys] = useState<string[]>(() => buildIdempotencyKeys(1))

  const [coins, setCoins] = useState<GachaCoins | null>(null)
  const [count, setCount] = useState(1)
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

  // 取り直した available が指定枚数より少なくなったら詰める（上限はサーバーの値）
  useEffect(() => {
    if (!coins) return
    setCount((c) => clampCoinCount(c, coins.available))
  }, [coins])

  function changeCount(next: number) {
    if (using || !coins) return
    const clamped = clampCoinCount(next, coins.available)
    if (clamped === count) return
    setCount(clamped)
    // 枚数が変わったら冪等キー列を作り直す（前の枚数のキーを流用すると成立済み扱いになる）
    setIdempotencyKeys(buildIdempotencyKeys(clamped))
    setErrorMessage('')
  }

  async function onUse() {
    if (!eventId || !userId || using || !coins) return
    const requested = clampCoinCount(count, coins.available)
    if (requested <= 0) return
    setUsing(true) // 押下直後に disabled
    setErrorMessage('')

    // 保持しているキー列を使う（再試行でも同じ列 → サーバーが成立済みとして 200 を返し枚数が増えない）。
    // 枚数とキー列の数がずれたときだけ作り直す（available が減って詰められた場合）
    let keys = idempotencyKeys
    if (keys.length !== requested) {
      keys = buildIdempotencyKeys(requested)
      setIdempotencyKeys(keys)
    }

    const { summary, stoppedByNoCoins, error } = await spendCoins({
      keys,
      useCoin: (key) => client.useCoin(eventId, userId, key),
    })

    // 成立した分は取り消せないので、1枚でも成立していれば完了画面へ進む。
    // 部分成功のときは完了画面が「n枚使えました。残りm枚は使えませんでした。」と出す。
    if (summary) {
      navigate('/gachapon/complete', { replace: true, state: summary })
      return
    }

    // 1枚も成立しなかったとき
    setUsing(false)
    if (stoppedByNoCoins) {
      setErrorMessage('他の端末で使い切った可能性があります。最新の枚数を取り直しました。')
      await reload()
      return
    }
    const err = toApiError(error)
    if (err instanceof ApiError && err.code === GACHA_DISABLED) {
      setCoins((c) => (c ? { ...c, is_enabled: false } : c))
      return
    }
    setErrorMessage('コインの使用に失敗しました。もう一度お試しください。')
    // 同じ枚数・同じキー列で再試行できる（冪等キーが同じなので枚数は増えない）
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
            {/* issue #104: 「準備中」「終了」と読める文言にしない。コインが消えたと誤解される */}
            <p className="lead">ただいまガチャを停止しています。</p>
            <p className="text-muted">
              コインは無くなりませんので、しばらくしてからもう一度お試しください。
            </p>
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
                <img key={i} src="/gacha/coin.png" alt="" className={i < count ? '' : 'coin-unselected'} />
              ))}
            </div>

            {/* available が1枚のときはステッパーを出さない（従来どおりの1枚フロー） */}
            {coins.available > 1 ? (
              <div className="coin-count-stepper mb-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-coin-step"
                  aria-label="使う枚数を1枚減らす"
                  disabled={using || count <= 1}
                  onClick={() => changeCount(count - 1)}
                >
                  −
                </button>
                <output className="coin-count-value" aria-live="polite">
                  {count}枚
                </output>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-coin-step"
                  aria-label="使う枚数を1枚増やす"
                  disabled={using || count >= coins.available}
                  onClick={() => changeCount(count + 1)}
                >
                  ＋
                </button>
              </div>
            ) : null}

            <p className="text-muted small mb-3">
              「{count}枚使う」を押すと、その場でコインが{count}枚消費されます。
              <strong>使用後は取り消せません。</strong>
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
                  `${count}枚使う`
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
