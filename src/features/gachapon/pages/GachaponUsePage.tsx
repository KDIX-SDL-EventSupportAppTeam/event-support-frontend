import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createParticipantClient } from '@/shared/data/createParticipantClient'
import { useAuthStore } from '@/features/auth/store/authStore'

export function GachaponUsePage() {
  const navigate = useNavigate()
  const eventId = useAuthStore((s) => s.user?.event_id)
  const userId = useAuthStore((s) => s.user?.id)
  const [availableCoins, setAvailableCoins] = useState(0)
  const [loading, setLoading] = useState(true)
  const [using, setUsing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!eventId || !userId) {
      setLoading(false)
      return
    }
    const client = createParticipantClient()
    ;(async () => {
      try {
        const n = await client.getAvailableGachaponCoins(eventId, userId)
        setAvailableCoins(n)
      } catch {
        setErrorMessage('コイン情報の取得に失敗しました。')
      } finally {
        setLoading(false)
      }
    })()
  }, [eventId, userId])

  async function spendGachaponCoin() {
    if (!eventId || !userId) return
    setUsing(true)
    setErrorMessage('')
    try {
      const client = createParticipantClient()
      await client.postUseGachaponCoin(eventId, userId)
      navigate('/gachapon/complete')
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'コインの使用に失敗しました。')
    } finally {
      setUsing(false)
    }
  }

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
        ) : availableCoins > 0 ? (
          <>
            <p className="lead">所持コイン数: {availableCoins}枚</p>
            <div className="coins-display my-4">
              {Array.from({ length: availableCoins }).map((_, i) => (
                <img key={i} src="/icons/coin-gold.png" alt="" />
              ))}
            </div>
            <div className="d-grid gap-2">
              <button type="button" className="btn btn-danger btn-proceed" disabled={using} onClick={() => void spendGachaponCoin()}>
                {using ? <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden /> : null}
                使用する
              </button>
              <button type="button" className="btn btn-secondary btn-back" onClick={() => navigate('/gachapon')}>
                もどる
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="lead">使用できるコインがありません。</p>
            <div className="d-grid">
              <button type="button" className="btn btn-secondary btn-back" onClick={() => navigate('/gachapon')}>
                もどる
              </button>
            </div>
          </>
        )}
        {errorMessage ? (
          <p className="text-danger mt-3 mb-0" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  )
}
