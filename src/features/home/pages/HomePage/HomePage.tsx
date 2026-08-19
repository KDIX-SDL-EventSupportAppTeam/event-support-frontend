import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHomeBingoData } from '@/features/home/hooks/useHomeBingoData'
import { useBingoUnlockedSocket } from '@/features/home/hooks/useBingoUnlockedSocket'
import { useExhibitorStore } from '@/features/exhibitor/store/exhibitorStore'
import { useAuthStore } from '@/shared/auth/authStore'
import { fetchPublicEvent } from '@/shared/api/publicEvent'
import { hasPlayedUnlockAnimation, markUnlockAnimationPlayed } from '@/shared/lib/bingoUnlockFlag'
import { BingoCardView } from '@/features/home/components/bingo/BingoCardView'
import { UnlockAnimation } from '@/features/home/components/bingo/UnlockAnimation'
import { HomeTutorialModal } from '@/features/home/pages/HomePage/HomeTutorialModal'
import '@/features/home/styles/legacy-home.scss'
import '@/features/home/styles/bingo-card.scss'

const FEEDBACK_FORM_URL =
  (import.meta.env.VITE_FEEDBACK_FORM_URL as string | undefined) ?? 'https://forms.gle/7jf7E6DVHvBmLNKA6'

export function HomePage() {
  const navigate = useNavigate()
  const eventId = useAuthStore((s) => s.user?.event_id)
  const userId = useAuthStore((s) => s.user?.id)
  const clearSession = useAuthStore((s) => s.clearSession)
  const { card, loading, error, refetch } = useHomeBingoData(eventId, userId)
  const missingUserContext = !eventId || !userId

  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false)

  const handleUnlocked = useCallback(
    (payload: { card_id: string; unlocked_at: string }) => {
      // socket.io の bingo:unlocked は副経路。正の経路（チェックインレスポンス）で
      // 既に再生済みなら重複再生しない（docs/.sdd/02-bingo-card/unlock-animation.md）
      if (hasPlayedUnlockAnimation(payload.card_id)) return
      markUnlockAnimationPlayed(payload.card_id)
      setShowUnlockAnimation(true)
    },
    [],
  )
  useBingoUnlockedSocket(handleUnlocked)

  function closeUnlockAnimation() {
    setShowUnlockAnimation(false)
    void refetch()
  }

  const isExhibitor = useExhibitorStore((s) => s.isExhibitor)
  const ensureExhibitorLoaded = useExhibitorStore((s) => s.ensureLoaded)

  useEffect(() => {
    if (!eventId || !userId) return
    ensureExhibitorLoaded(eventId, userId)
  }, [eventId, userId, ensureExhibitorLoaded])

  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [feedbackConfirmOpen, setFeedbackConfirmOpen] = useState(false)
  const [bingoModalOpen, setBingoModalOpen] = useState(false)
  const [coinLimitModalOpen, setCoinLimitModalOpen] = useState(false)
  const [newCoinsWon, setNewCoinsWon] = useState(0)
  const [surveyUrl, setSurveyUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    let active = true
    fetchPublicEvent(eventId)
      .then((e) => {
        if (active) setSurveyUrl(e.survey_url)
      })
      .catch(() => {
        /* 未設定扱いで非表示（モック/サンプルモード・通信失敗時も壊さない） */
      })
    return () => {
      active = false
    }
  }, [eventId])

  useEffect(() => {
    const newlyCompletedLines = Number.parseInt(sessionStorage.getItem('newlyCompletedLines') ?? '0', 10)
    const newCoinsAwarded = Number.parseInt(sessionStorage.getItem('newCoinsAwarded') ?? '0', 10)
    if (newlyCompletedLines > 0) {
      if (newCoinsAwarded > 0) {
        setNewCoinsWon(newCoinsAwarded)
        setBingoModalOpen(true)
      } else {
        setCoinLimitModalOpen(true)
      }
    }
    sessionStorage.removeItem('newlyCompletedLines')
    sessionStorage.removeItem('newCoinsAwarded')
  }, [])

  return (
    <div className="legacy-home container py-3 px-2">
      {bingoModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="bingo-modal-title">
          <div className="modal-content text-center">
            <h2 id="bingo-modal-title" className="bingo-celebration-title">
              🎉 BINGO! 🎉
            </h2>
            <p className="bingo-celebration-message">
              おめでとうございます！
              <br />
              ガチャポンコインを{newCoinsWon}枚獲得しました！
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setBingoModalOpen(false)}>
              閉じる
            </button>
          </div>
        </div>
      ) : null}

      {coinLimitModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="coin-limit-title">
          <div className="modal-content text-center">
            <h2 id="coin-limit-title" className="bingo-celebration-title">
              🎉 BINGO! 🎉
            </h2>
            <p className="bingo-celebration-message">
              ビンゴ達成おめでとうございます！
              <br />
              ※コインの獲得上限（4枚）に達しているため、新しいコインは獲得できません。
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setCoinLimitModalOpen(false)}>
              閉じる
            </button>
          </div>
        </div>
      ) : null}

      {feedbackConfirmOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content text-center">
            <h5 className="modal-title">アンケートを開きます</h5>
            <p className="modal-body-text">アンケートフォームを新しいタブで開きます。よろしいですか？</p>
            <div className="modal-footer-buttons">
              <button type="button" className="btn-custom-secondary" onClick={() => setFeedbackConfirmOpen(false)}>
                キャンセル
              </button>
              <button
                type="button"
                className="btn-custom-primary-red"
                onClick={() => {
                  window.open(FEEDBACK_FORM_URL, '_blank', 'noopener,noreferrer')
                  setFeedbackConfirmOpen(false)
                }}
              >
                はい
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {tutorialOpen ? <HomeTutorialModal onClose={() => setTutorialOpen(false)} /> : null}

      {showUnlockAnimation ? <UnlockAnimation onDone={closeUnlockAnimation} /> : null}

      {loading ? (
        <div className="text-center p-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">ビンゴカードを生成中...</p>
        </div>
      ) : missingUserContext ? (
        <div className="text-center p-5">
          <p className="mb-3">ユーザー情報が読み込めませんでした。再度ログインしてください。</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              clearSession()
              navigate('/login', { replace: true })
            }}
          >
            ログインへ
          </button>
        </div>
      ) : error ? (
        <div className="text-center p-5">
          <p className="text-danger mb-3">{error}</p>
          <p className="small text-muted mb-0">
            開発では <code>VITE_DATA_SOURCE=sample</code>。実 API では <code>api</code>、{' '}
            <code>VITE_MOCK_API=false</code>、<code>docker compose up -d mysql</code>、{' '}
            <code>server/</code> の <code>npm run dev</code> を確認してください。
          </p>
        </div>
      ) : !card ? (
        <div className="text-center p-5">
          <p className="mb-0">ビンゴカードを表示できませんでした。</p>
        </div>
      ) : (
        <div className="bingo-wrapper mx-auto p-2 border rounded">
          <BingoCardView card={card} eventId={eventId as string} onRated={() => void refetch()} />
        </div>
      )}

      <div className="row g-3 mt-0">
        <div className="col-12">
          <div className="d-grid">
            <button
              type="button"
              className="btn btn-light action-button btn-gachapon"
              onClick={() => navigate('/gachapon')}
            >
              <img src="/icons/gacha1.png" alt="" className="gachapon-icon" />
              <span>ガチャポンコインを使う</span>
              <img src="/icons/gacha2.png" alt="" className="gachapon-icon" />
            </button>
          </div>
        </div>
        <div className="col-6">
          <div className="d-grid">
            <button
              type="button"
              className="btn btn-light action-button"
              onClick={() => navigate('/booth-list')}
            >
              <img src="/icons/map.png" alt="" className="action-icon" />
              <span>ブース一覧</span>
            </button>
          </div>
        </div>
        <div className="col-6">
          <div className="d-grid">
            <button
              type="button"
              className="btn btn-light action-button"
              onClick={() => navigate('/checkin')}
            >
              <img src="/icons/qr-code-scan.png" alt="" className="action-icon" />
              <span>チェックイン</span>
            </button>
          </div>
        </div>
        <div className="col-6">
          <div className="d-grid">
            <button
              type="button"
              className="btn btn-light action-button"
              onClick={() => navigate('/schedule')}
            >
              <img src="/icons/time-table.png" alt="" className="action-icon" />
              <span>スケジュール</span>
            </button>
          </div>
        </div>
        <div className="col-6">
          <div className="d-grid">
            <button
              type="button"
              className="btn btn-light action-button"
              onClick={() => navigate('/award-vote')}
            >
              <img src="/icons/trophy.png" alt="" className="action-icon" />
              <span>アワード投票</span>
            </button>
          </div>
        </div>
      </div>

      {isExhibitor ? (
        <div className="row g-2 mt-2">
          <div className="col-12">
            <button
              type="button"
              className="btn btn-sub-action w-100"
              onClick={() => navigate('/exhibitor')}
            >
              <i className="bi bi-shop me-1" />
              出展者画面へ
            </button>
          </div>
        </div>
      ) : null}

      {/* 暫定UI: デザイン更新issueで差し替え予定（#48 暫定・survey_url 設定時のみ表示） */}
      {surveyUrl ? (
        <div className="row g-3 mt-0">
          <div className="col-12">
            <div className="d-grid">
              <button
                type="button"
                className="btn btn-light action-button"
                onClick={() => window.open(surveyUrl, '_blank', 'noopener,noreferrer')}
              >
                <span>イベントアンケートに回答する</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="row g-2 mt-2 sub-actions">
        <div className="col-4">
          <button type="button" className="btn btn-sub-action" onClick={() => setTutorialOpen(true)}>
            アプリ説明
          </button>
        </div>
        <div className="col-4">
          <button type="button" className="btn btn-sub-action" onClick={() => navigate('/qa')}>
            Q&amp;A
          </button>
        </div>
        <div className="col-4">
          <button type="button" className="btn btn-sub-action" onClick={() => setFeedbackConfirmOpen(true)}>
            アプリ
            <br />
            フィードバック
          </button>
        </div>
      </div>
    </div>
  )
}
