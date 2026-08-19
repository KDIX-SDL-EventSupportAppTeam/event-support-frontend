import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  fetchV1BingoCard,
  postV1CheckIn,
  postV1CheckInRating,
  type V1CheckInResponse,
} from '@/shared/api/v1Participant'
import { ApiError } from '@/shared/api/unwrap'
import { createParticipantClient } from '@/shared/data/createParticipantClient'
import { resolveEventDataSourceMode } from '@/shared/data/createEventDataSource'
import { useLegacyBoothList } from '@/shared/hooks/useLegacyBoothList'
import { formatClientError } from '@/shared/lib/formatClientError'
import { hasPlayedUnlockAnimation, markUnlockAnimationPlayed } from '@/shared/lib/bingoUnlockFlag'
import { CheckInRatingModal } from '@/features/checkin/pages/CheckInRatingModal'
import { UnlockAnimation } from '@/features/home/components/bingo/UnlockAnimation'
import { useAuthStore } from '@/shared/auth/authStore'
import type { LegacyBooth } from '@/shared/types/legacyBooth'
import type { CheckInResult } from '@/shared/types/checkin'

// 段階解放版のフロー（docs/.sdd/03-checkin-flow/rating-modal.md, checkin-result.md）:
//   booth（ブース選択）→ checkin（送信） →
//   rating（pending_rating が非 null のときのみ、前ブースの評価を先頭で聞く） →
//   result（チェックイン成功。unlocked なら解放演出へ）
//
// Q-F1（docs/.sdd/06-open-questions/open-questions.md）: 推薦は外側12マスに同化させる方針で
// 「推薦欄」単体の役割は未決定。CheckInRecommendView.tsx 自体には手を入れず、
// この新フローからは呼び出さない（新フローの仕様に推薦ステップは無い）。
type Step = 'booth' | 'rating' | 'already_visited' | 'result'

export function CheckInPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const boothIdParam = searchParams.get('booth_id')?.trim() ?? ''

  const userId = useAuthStore((s) => s.user?.id)
  const eventId = useAuthStore((s) => s.user?.event_id)
  const isV1Flow = resolveEventDataSourceMode() === 'api'

  const { booths, checkedInBoothIds, loading: boothsLoading } = useLegacyBoothList(eventId, userId)

  const [step, setStep] = useState<Step>('booth')
  const [selectedBoothId, setSelectedBoothId] = useState(boothIdParam)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null)
  const [checkInResponse, setCheckInResponse] = useState<V1CheckInResponse | null>(null)
  const [ratingScale, setRatingScale] = useState<number>(3)
  const [cardId, setCardId] = useState<string | null>(null)
  const [cooldownRemainingSec, setCooldownRemainingSec] = useState(0)
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false)

  const selectedBooth: LegacyBooth | undefined = useMemo(
    () => booths.find((b) => b.booth_id === selectedBoothId),
    [booths, selectedBoothId],
  )

  const alreadyCheckedIn = selectedBoothId ? checkedInBoothIds.includes(selectedBoothId) : false

  useEffect(() => {
    if (boothIdParam) setSelectedBoothId(boothIdParam)
  }, [boothIdParam])

  // rating_scale / card_id は事前にカードを1回取得しておく（Q-F2: ハードコードしない）
  useEffect(() => {
    if (!eventId || !isV1Flow) return
    let active = true
    fetchV1BingoCard(eventId)
      .then((card) => {
        if (!active) return
        setRatingScale(card.rating_scale)
        setCardId(card.card_id)
      })
      .catch(() => {
        /* 取得に失敗しても既定値（3）で続行する */
      })
    return () => {
      active = false
    }
  }, [eventId, isV1Flow])

  useEffect(() => {
    if (cooldownRemainingSec <= 0) return
    const timer = window.setInterval(() => {
      setCooldownRemainingSec((s) => Math.max(0, s - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldownRemainingSec])

  async function handleCheckInV1() {
    if (!eventId || !selectedBoothId) return
    setSubmitting(true)
    setErrorMessage(null)
    try {
      const res = await postV1CheckIn(eventId, {
        method: 'qr',
        booth_id: selectedBoothId,
        checked_in_at: new Date().toISOString(),
      })
      setCheckInResponse(res)
      setCheckInResult({ checkin_id: res.checkin_id, booth: { booth_id: res.booth.id, name: res.booth.name, emoji: '🎪' } })
      if (res.cooldown_remaining_sec > 0) setCooldownRemainingSec(res.cooldown_remaining_sec)
      setStep(res.pending_rating ? 'rating' : 'result')
    } catch (e) {
      if (e instanceof ApiError && e.code === 'CONFLICT') {
        // ALREADY_VISITED はエラーとして赤く出さない（同じ QR の再読み取りは正常な行動）
        setStep('already_visited')
      } else if (e instanceof ApiError && e.code === 'COOLDOWN') {
        const match = /(\d+)/.exec(e.message)
        setCooldownRemainingSec(match ? Number(match[1]) : 30)
        setErrorMessage(e.message || 'クールダウン中です。しばらくお待ちください。')
      } else {
        setErrorMessage(formatClientError(e, 'チェックインに失敗しました'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCheckInSample() {
    if (!eventId || !userId || !selectedBoothId) return
    setSubmitting(true)
    setErrorMessage(null)
    try {
      const client = createParticipantClient()
      const res = await client.postCheckIn(eventId, userId, selectedBoothId)
      setCheckInResult(res)
      setStep('result')
    } catch (e) {
      if (e instanceof ApiError && e.code === 'CONFLICT') {
        setStep('already_visited')
      } else {
        setErrorMessage(formatClientError(e, 'チェックインに失敗しました'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCheckIn() {
    if (!eventId || !userId || !selectedBoothId) return
    if (alreadyCheckedIn) {
      setErrorMessage('このブースには既にチェックイン済みです。')
      return
    }
    if (isV1Flow) {
      await handleCheckInV1()
    } else {
      await handleCheckInSample()
    }
  }

  async function submitPendingRating(rating: number, comment: string) {
    if (!eventId || !checkInResponse?.pending_rating) {
      setStep('result')
      return
    }
    setSubmitting(true)
    try {
      // 評価の送信失敗はチェックイン成功表示を妨げない（失敗は握りつぶし、次回 pending_rating で再提示される）
      await postV1CheckInRating(eventId, checkInResponse.pending_rating.checkin_id, rating, comment, 'NEXT_CHECKIN')
    } catch {
      /* noop */
    } finally {
      setSubmitting(false)
      setStep('result')
    }
  }

  function skipPendingRating() {
    setStep('result')
  }

  function finishAndGoHome() {
    if (checkInResponse?.unlocked && cardId && !hasPlayedUnlockAnimation(cardId)) {
      markUnlockAnimationPlayed(cardId)
      setShowUnlockAnimation(true)
      return
    }
    navigate('/home', { replace: true })
  }

  function afterUnlockAnimation() {
    setShowUnlockAnimation(false)
    navigate('/home', { replace: true })
  }

  if (!userId || !eventId) {
    return (
      <div className="reader-container container py-3">
        <p className="mb-3">ユーザー情報が取得できません。再ログインしてください。</p>
        <button type="button" className="checkin-home-button" onClick={() => navigate('/login')}>
          ログインへ
        </button>
      </div>
    )
  }

  if (showUnlockAnimation) {
    return <UnlockAnimation onDone={afterUnlockAnimation} />
  }

  if (step === 'rating' && checkInResponse?.pending_rating) {
    return (
      <CheckInRatingModal
        boothName={checkInResponse.pending_rating.booth_name}
        ratingScale={ratingScale}
        submitting={submitting}
        onSubmit={(r, c) => void submitPendingRating(r, c)}
        onSkip={skipPendingRating}
      />
    )
  }

  if (step === 'already_visited') {
    return (
      <div className="reader-container container py-3">
        <div className="result-ui-container">
          <h2 className="result-title">訪問済みです</h2>
          <p className="result-message">
            このブースは既にチェックイン済みです。
            <br />
            引き続きイベントをお楽しみください。
          </p>
          <button type="button" className="checkin-home-button" onClick={() => navigate('/home')}>
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  if (step === 'result' && checkInResult) {
    return (
      <div className="reader-container container py-3">
        <div className="result-ui-container">
          <img src="/icons/success.png" alt="" className="success-icon" />
          <h2 className="result-title">チェックイン完了！</h2>
          <div className="booth-emoji-large">{checkInResult.booth.emoji}</div>
          <p className="result-message">
            「{checkInResult.booth.name}」への
            <br />
            チェックインが完了しました。
          </p>
          {checkInResponse?.filled_cell ? (
            <p className="small text-muted">ビンゴカードのマスが1つ埋まりました。</p>
          ) : null}
          <button type="button" className="checkin-home-button" onClick={finishAndGoHome}>
            ホームに戻る
          </button>
        </div>
        {errorMessage ? <p className="text-danger mt-3">{errorMessage}</p> : null}
      </div>
    )
  }

  return (
    <div className="reader-container container py-3">
      <h2 className="result-title">チェックイン</h2>
      <p className="result-message mb-3">ブースを選んでチェックインしてください。</p>

      {boothsLoading ? (
        <div className="py-4 text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">読み込み中</span>
          </div>
        </div>
      ) : booths.length === 0 ? (
        <p className="text-muted">ブースがありません。</p>
      ) : (
        <div className="checkin-booth-picker d-grid gap-2 mb-4">
          {booths.map((booth) => {
            const checked = checkedInBoothIds.includes(booth.booth_id)
            const active = selectedBoothId === booth.booth_id
            return (
              <button
                key={booth.booth_id}
                type="button"
                className={`btn text-start checkin-booth-option ${active ? 'active' : ''} ${checked ? 'disabled' : ''}`}
                disabled={checked}
                onClick={() => setSelectedBoothId(booth.booth_id)}
              >
                <span className="me-2">{booth.booth_emoji}</span>
                <strong>{booth.booth_name}</strong>
                <span className="ms-2 small text-muted">
                  {(booth.booth_display_code ?? booth.booth_id).toUpperCase()}
                </span>
                {checked ? <span className="ms-2 small text-success">済</span> : null}
              </button>
            )
          })}
        </div>
      )}

      {selectedBooth ? (
        <div className="checkin-selected-summary mb-3 p-3 border rounded">
          <p className="mb-0">
            <span className="booth-emoji-large d-inline-block me-2">{selectedBooth.booth_emoji}</span>
            {selectedBooth.booth_name}
          </p>
        </div>
      ) : null}

      {errorMessage ? <p className="text-danger mb-3">{errorMessage}</p> : null}

      {cooldownRemainingSec > 0 ? (
        <p className="text-muted mb-3">あと{cooldownRemainingSec}秒お待ちください</p>
      ) : null}

      <div className="d-grid gap-2">
        <button
          type="button"
          className="checkin-home-button"
          disabled={!selectedBoothId || submitting || alreadyCheckedIn || boothsLoading || cooldownRemainingSec > 0}
          onClick={() => void handleCheckIn()}
        >
          {submitting ? 'チェックイン中…' : 'チェックインする'}
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/home')}>
          ホームに戻る
        </button>
      </div>
    </div>
  )
}
