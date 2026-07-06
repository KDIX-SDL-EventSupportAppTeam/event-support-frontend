import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  fetchV1Recommendations,
  postV1CheckInRating,
  postV1SelectRecommendation,
  type V1RecommendationBooth,
  type V1RecommendationsResponse,
} from '@/shared/api/v1Participant'
import { ApiError } from '@/shared/api/unwrap'
import { createParticipantClient } from '@/shared/data/createParticipantClient'
import { resolveEventDataSourceMode } from '@/shared/data/createEventDataSource'
import { useLegacyBoothList } from '@/shared/hooks/useLegacyBoothList'
import { formatClientError } from '@/shared/lib/formatClientError'
import { CheckInRatingModal } from '@/features/checkin/pages/CheckInRatingModal'
import { CheckInRecommendView } from '@/features/checkin/pages/CheckInRecommendView'
import { useAuthStore } from '@/shared/auth/authStore'
import type { LegacyBooth } from '@/shared/types/legacyBooth'
import type { CheckInResult } from '@/shared/types/checkin'

type Step = 'booth' | 'rating' | 'recommend' | 'done'

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
  const [recommendations, setRecommendations] = useState<V1RecommendationsResponse | null>(null)
  const [recommendLoading, setRecommendLoading] = useState(false)

  const selectedBooth: LegacyBooth | undefined = useMemo(
    () => booths.find((b) => b.booth_id === selectedBoothId),
    [booths, selectedBoothId],
  )

  const alreadyCheckedIn = selectedBoothId ? checkedInBoothIds.includes(selectedBoothId) : false

  useEffect(() => {
    if (boothIdParam) setSelectedBoothId(boothIdParam)
  }, [boothIdParam])

  const loadRecommendations = useCallback(async () => {
    if (!eventId || !isV1Flow) return
    setRecommendLoading(true)
    setErrorMessage(null)
    try {
      const data = await fetchV1Recommendations(eventId)
      setRecommendations(data)
      setStep('recommend')
    } catch (e) {
      setErrorMessage(formatClientError(e, 'おすすめの取得に失敗しました'))
      setStep('done')
    } finally {
      setRecommendLoading(false)
    }
  }, [eventId, isV1Flow])

  async function handleCheckIn() {
    if (!eventId || !userId || !selectedBoothId) return
    if (alreadyCheckedIn) {
      setErrorMessage('このブースには既にチェックイン済みです。')
      return
    }
    setSubmitting(true)
    setErrorMessage(null)
    try {
      const client = createParticipantClient()
      const res = await client.postCheckIn(eventId, userId, selectedBoothId)
      setCheckInResult(res)
      if (isV1Flow) {
        setStep('rating')
      } else {
        setStep('done')
      }
    } catch (e) {
      if (e instanceof ApiError && e.code === 'CONFLICT') {
        setErrorMessage('このブースには既にチェックイン済みです。')
      } else {
        setErrorMessage(formatClientError(e, 'チェックインに失敗しました'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRatingSubmit(rating: number) {
    if (!eventId || !checkInResult || !isV1Flow) return
    setSubmitting(true)
    setErrorMessage(null)
    try {
      await postV1CheckInRating(eventId, checkInResult.checkin_id, rating)
      await loadRecommendations()
    } catch (e) {
      setErrorMessage(formatClientError(e, '評価の送信に失敗しました'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRatingSkip() {
    if (isV1Flow) {
      await loadRecommendations()
    } else {
      navigate('/home', { replace: true })
    }
  }

  async function handleRecommendSelect(boothId: string) {
    if (!eventId || !recommendations) return
    setSubmitting(true)
    setErrorMessage(null)
    try {
      await postV1SelectRecommendation(eventId, recommendations.recommendation_id, boothId)
      navigate('/home', { replace: true })
    } catch (e) {
      setErrorMessage(formatClientError(e, '選択の送信に失敗しました'))
      setSubmitting(false)
    }
  }

  function handleRecommendSkip() {
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

  if (step === 'rating' && checkInResult) {
    return (
      <CheckInRatingModal
        boothName={checkInResult.booth.name}
        submitting={submitting}
        onSubmit={(r) => void handleRatingSubmit(r)}
        onSkip={() => void handleRatingSkip()}
      />
    )
  }

  if (step === 'recommend') {
    return (
      <div className="reader-container container py-3">
        <CheckInRecommendView
          booths={recommendations?.booths ?? ([] as V1RecommendationBooth[])}
          loading={recommendLoading}
          submitting={submitting}
          onSelect={(id) => void handleRecommendSelect(id)}
          onSkip={handleRecommendSkip}
        />
        {errorMessage ? <p className="text-danger mt-3">{errorMessage}</p> : null}
      </div>
    )
  }

  if (step === 'done' && checkInResult) {
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
          <button type="button" className="checkin-home-button" onClick={() => navigate('/home')}>
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

      <div className="d-grid gap-2">
        <button
          type="button"
          className="checkin-home-button"
          disabled={!selectedBoothId || submitting || alreadyCheckedIn || boothsLoading}
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
