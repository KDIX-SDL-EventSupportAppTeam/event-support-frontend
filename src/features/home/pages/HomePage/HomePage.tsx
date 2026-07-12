import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHomeBingoData } from '@/features/home/hooks/useHomeBingoData'
import { useAuthStore } from '@/shared/auth/authStore'
import { fetchPublicEvent } from '@/shared/api/publicEvent'
import type { LegacyBooth } from '@/shared/types/legacyBooth'
import { HomeTutorialModal } from '@/features/home/pages/HomePage/HomeTutorialModal'
import '@/features/home/styles/legacy-home.scss'

const FEEDBACK_FORM_URL =
  (import.meta.env.VITE_FEEDBACK_FORM_URL as string | undefined) ?? 'https://forms.gle/7jf7E6DVHvBmLNKA6'

export function HomePage() {
  const navigate = useNavigate()
  const eventId = useAuthStore((s) => s.user?.event_id)
  const userId = useAuthStore((s) => s.user?.id)
  const clearSession = useAuthStore((s) => s.clearSession)
  const { grid, bingoCount, gachaponCoinsSpent, checkedInBoothIds, loading, error } = useHomeBingoData(eventId, userId)
  const missingUserContext = !eventId || !userId
  const hasBoothCells = grid.some((c) => c !== null)

  const [selectedBooth, setSelectedBooth] = useState<LegacyBooth | null>(null)
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

  function isCheckedIn(boothId: string) {
    return checkedInBoothIds.includes(boothId)
  }

  function openBoothDetail(booth: LegacyBooth) {
    setSelectedBooth(booth)
  }

  function closeBoothDetail() {
    setSelectedBooth(null)
  }

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

      {selectedBooth ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeBoothDetail}>
          <div className="modal-content booth-detail-popup text-start" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title w-100">{selectedBooth.booth_name}</h5>
              <button type="button" className="btn-close" aria-label="閉じる" onClick={closeBoothDetail} />
            </div>
            <div className="modal-body pt-2">
              <img
                src={selectedBooth.booth_image_url ?? '/logo_main.png'}
                alt=""
                className="img-fluid rounded mb-3"
              />
              <h5 className="fs-6">
                <i className="bi bi-geo-alt-fill" aria-hidden /> 場所:{' '}
                <span className="booth-id-large">
                  {(selectedBooth.booth_display_code ?? selectedBooth.booth_id).toUpperCase()}
                </span>
              </h5>
              <p className="mt-3 mb-0">{selectedBooth.booth_description || '説明がありません。'}</p>
            </div>
            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn btn-secondary btn-modal-close" onClick={closeBoothDetail}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
      ) : grid.length === 0 ? (
        <div className="text-center p-5">
          <p className="mb-0">ビンゴカードを表示できませんでした。</p>
        </div>
      ) : !hasBoothCells ? (
        <div className="text-center p-5">
          <p className="mb-2">ブースが登録されていないため、ビンゴカードを作れません。</p>
          <p className="small text-muted mb-0">
            <code>cd server && npm run db:seed</code> を実行し、API サーバーを再起動してください。
          </p>
        </div>
      ) : (
        <div className="bingo-wrapper mx-auto p-2 border rounded">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="mb-0 ms-2 main-title">
              <span className="sub-title">PRoTo FES</span>
              <br />
              BINGO
            </h1>
            <div className="bingo-coins">
              {Array.from({ length: Math.max(0, bingoCount - gachaponCoinsSpent) }).map((_, i) => (
                <img key={`gold-${i}`} src="/icons/coin-gold.png" alt="" />
              ))}
              {Array.from({ length: Math.max(0, 4 - bingoCount) }).map((_, i) => (
                <img key={`gray-${i}`} src="/icons/coin-gray.png" alt="" />
              ))}
            </div>
          </div>

          <div className="row g-1 g-sm-2 mt-2">
            {grid.map((booth, index) => (
              <div key={booth ? booth.booth_id : `empty-${index}`} className="col-3">
                <div
                  role={booth ? 'button' : undefined}
                  tabIndex={booth ? 0 : undefined}
                  className={`bingo-cell d-flex flex-column justify-content-center align-items-center text-center p-1 ${
                    booth ? '' : 'bingo-cell-empty'
                  } ${booth && isCheckedIn(booth.booth_id) ? 'checked-in' : ''} ${
                    booth?.is_recommendation ? 'is-recommendation' : ''
                  }`}
                  onClick={() => booth && openBoothDetail(booth)}
                  onKeyDown={(e) => {
                    if (booth && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      openBoothDetail(booth)
                    }
                  }}
                >
                  {booth ? (
                    <>
                      <span className="booth-emoji">{booth.booth_emoji}</span>
                      <div className="booth-text-container">
                        <span className="booth-number">
                          {(booth.booth_display_code ?? booth.booth_id).toUpperCase()}
                        </span>
                        <span className="booth-name">{booth.booth_name}</span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
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
