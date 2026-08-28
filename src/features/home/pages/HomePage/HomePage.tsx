import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHomeBingoData } from '@/features/home/hooks/useHomeBingoData'
import { useBingoUnlockedSocket } from '@/features/home/hooks/useBingoUnlockedSocket'
import { useExhibitorStore } from '@/features/exhibitor/store/exhibitorStore'
import { useAuthStore } from '@/shared/auth/authStore'
import { fetchPublicEvent } from '@/shared/api/publicEvent'
import { useUnlockAnimationQueue } from '@/shared/hooks/useUnlockAnimationQueue'
import { consumeBingoCelebration } from '@/shared/lib/bingoCelebration'
import { hasSeenCoinComplete, markCoinCompleteSeen } from '@/shared/lib/coinCelebration'
import { BingoCardView } from '@/features/home/components/bingo/BingoCardView'
import { createGachaClient, type GachaCoins } from '@/features/gachapon/api/gachaClient'
import { UnlockAnimation } from '@/features/home/components/bingo/UnlockAnimation'
import { HomeTutorialModal } from '@/features/home/pages/HomePage/HomeTutorialModal'
import { Modal } from '@/shared/components/modal/Modal'
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

  const { current: currentUnlock, enqueuePairs, advance } = useUnlockAnimationQueue()

  // カード取得のたびに、この端末でまだ再生していない解放演出をキューに積む
  // （評価送信などでカードが再取得され card の identity が変わっても、キュー内の
  //  pair_key 重複チェックで同じ演出が二重に積まれることはない）
  // （正の経路＝チェックインレスポンスを見逃した場合の取りこぼし対策。02-unlock-animation.md）
  useEffect(() => {
    if (card) enqueuePairs(card.card_id, card.unlock_events)
  }, [card, enqueuePairs])

  const handleUnlocked = useCallback(() => {
    // socket.io の bingo:unlocked は副経路。カードを再取得し、unlock_events から
    // 未再生の演出をキューに積み直す（docs/specs/bingo-dynamic-unlock/02-unlock-animation.md）
    void refetch()
  }, [refetch])
  useBingoUnlockedSocket(handleUnlocked)

  function closeUnlockAnimation() {
    if (card) advance(card.card_id)
  }

  const isExhibitor = useExhibitorStore((s) => s.isExhibitor)
  const ensureExhibitorLoaded = useExhibitorStore((s) => s.ensureLoaded)

  useEffect(() => {
    if (!eventId || !userId) return
    ensureExhibitorLoaded(eventId, userId)
  }, [eventId, userId, ensureExhibitorLoaded])

  // ガチャコインの所持枚数。card 取得（＝チェックインでライン数が動いた可能性）のたび取り直す。
  const [gachaCoins, setGachaCoins] = useState<GachaCoins | null>(null)
  useEffect(() => {
    if (!eventId || !userId) return
    let alive = true
    void createGachaClient()
      .getCoins(eventId, userId)
      .then((c) => {
        if (alive) setGachaCoins(c)
      })
      .catch(() => {
        /* コインボタンは枚数なしで表示する（ナビゲーションは可能） */
      })
    return () => {
      alive = false
    }
  }, [eventId, userId, card])

  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [feedbackConfirmOpen, setFeedbackConfirmOpen] = useState(false)
  const [bingoModalOpen, setBingoModalOpen] = useState(false)
  const [coinCompleteOpen, setCoinCompleteOpen] = useState(false)
  const [tweetsComingSoonOpen, setTweetsComingSoonOpen] = useState(false)
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
    const { lines } = consumeBingoCelebration()
    if (lines > 0) setBingoModalOpen(true)
  }, [])

  // コイン上限到達の祝福。この端末で1回だけ出す。
  // - ビンゴ達成モーダルとは重ねない（閉じたあとに出す。bingoModalOpen を依存に入れている）
  // - 準備中（is_enabled=false）のときは出さない。使えないものの獲得を祝っても混乱するため
  // - 判定は earned >= max_coins。bonus_coins > 0 の運用では上限より少し早く出るが、
  //   確定値（1枚/ライン・上限4・ボーナス0）では上限到達と一致する
  useEffect(() => {
    if (!eventId || !userId || !gachaCoins || bingoModalOpen) return
    if (!gachaCoins.is_enabled || gachaCoins.max_coins <= 0) return
    if (gachaCoins.earned < gachaCoins.max_coins) return
    if (hasSeenCoinComplete(eventId, userId)) return
    markCoinCompleteSeen(eventId, userId)
    setCoinCompleteOpen(true)
  }, [eventId, userId, gachaCoins, bingoModalOpen])

  return (
    <div className="legacy-home container py-3 px-2">
      {bingoModalOpen ? (
        <Modal titleId="bingo-modal-title" onClose={() => setBingoModalOpen(false)} contentClassName="text-center">
          <img src="/feedback/popup-bingo-complete.png" alt="" className="modal-popup-image" />
          <h2 id="bingo-modal-title" className="visually-hidden">
            BINGO！おめでとうございます
          </h2>
          <p className="bingo-celebration-message">おめでとうございます！</p>
          <button type="button" className="btn btn-primary" onClick={() => setBingoModalOpen(false)}>
            閉じる
          </button>
        </Modal>
      ) : null}

      {coinCompleteOpen ? (
        <Modal
          titleId="coin-complete-modal-title"
          onClose={() => setCoinCompleteOpen(false)}
          contentClassName="text-center"
        >
          <img src="/feedback/popup-coin-complete.png" alt="" className="modal-popup-image" decoding="async" />
          <h2 id="coin-complete-modal-title" className="visually-hidden">
            ガチャポンコインを全て獲得しました
          </h2>
          <p className="bingo-celebration-message">
            コインが{gachaCoins?.max_coins ?? 0}枚たまりました！
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setCoinCompleteOpen(false)}>
            閉じる
          </button>
        </Modal>
      ) : null}

      {feedbackConfirmOpen ? (
        <Modal
          titleId="feedback-confirm-title"
          onClose={() => setFeedbackConfirmOpen(false)}
          contentClassName="text-center"
        >
          <h5 id="feedback-confirm-title" className="modal-title">
            アンケートを開きます
          </h5>
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
        </Modal>
      ) : null}

      {tweetsComingSoonOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="tweets-modal-title">
          <div className="modal-content text-center">
            <h5 id="tweets-modal-title" className="modal-title">
              つぶやき
            </h5>
            <p className="modal-body-text">この機能は準備中です。もうしばらくお待ちください。</p>
            <button type="button" className="btn btn-primary" onClick={() => setTweetsComingSoonOpen(false)}>
              閉じる
            </button>
          </div>
        </div>
      ) : null}

      {tutorialOpen ? <HomeTutorialModal onClose={() => setTutorialOpen(false)} /> : null}

      {currentUnlock ? <UnlockAnimation positions={currentUnlock.positions} onDone={closeUnlockAnimation} /> : null}

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
              disabled={gachaCoins != null && gachaCoins.available <= 0}
            >
              <img
                src="/icon/action/gacha-bag-on-primary.png"
                alt=""
                className="gachapon-icon"
                decoding="async"
              />
              <span>
                ガチャポンコインを使う
                {gachaCoins != null ? `（残り${gachaCoins.available}枚）` : ''}
              </span>
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

      <div className="row row-cols-5 g-2 mt-2 sub-actions">
        <div className="col">
          <button type="button" className="btn btn-sub-action" onClick={() => navigate('/venue-map')}>
            会場マップ
          </button>
        </div>
        <div className="col">
          <button type="button" className="btn btn-sub-action" onClick={() => setTutorialOpen(true)}>
            アプリ説明
          </button>
        </div>
        <div className="col">
          <button type="button" className="btn btn-sub-action" onClick={() => navigate('/qa')}>
            Q&amp;A
          </button>
        </div>
        <div className="col">
          <button type="button" className="btn btn-sub-action" onClick={() => setFeedbackConfirmOpen(true)}>
            アプリ
            <br />
            フィードバック
          </button>
        </div>
        <div className="col">
          <button type="button" className="btn btn-sub-action" onClick={() => setTweetsComingSoonOpen(true)}>
            <i className="bi bi-chat-dots me-1" aria-hidden="true" />
            つぶやき
          </button>
        </div>
      </div>
    </div>
  )
}
