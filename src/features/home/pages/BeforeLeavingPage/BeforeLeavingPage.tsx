import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/shared/auth/authStore'
import { fetchPublicEvent } from '@/shared/api/publicEvent'
import { hasOpenedSurvey, markSurveyOpened } from '@/shared/lib/surveyOpenedFlag'
import { createParticipantClient } from '@/shared/data/createParticipantClient'
import { resolveReturnBannerState } from '@/features/home/components/returnBannerView'
import { Modal } from '@/shared/components/modal/Modal'
import '@/features/home/styles/legacy-home.scss'

/**
 * 「帰宅する方へ」画面。ホーム下部のボタンから遷移する。
 *
 * 早く帰る参加者からアワード投票とイベントアンケートを**必ず**回収するための導線。
 * 2つを番号付きのステップとして並べ、未完了のものを目立たせる。
 * 投票済み・受付終了の判定はサーバーのスナップショットをそのまま使う（issue #151）。
 */
export function BeforeLeavingPage() {
  const navigate = useNavigate()
  const eventId = useAuthStore((s) => s.user?.event_id)
  const userId = useAuthStore((s) => s.user?.id)

  const [surveyUrl, setSurveyUrl] = useState<string | null>(null)
  const [surveyConfirmOpen, setSurveyConfirmOpen] = useState(false)
  const [surveyOpened, setSurveyOpened] = useState(false)
  // 取得できないうちは null（受付中・未投票として扱い、導線を隠さない）
  const [votingOpen, setVotingOpen] = useState<boolean | null>(null)
  const [awardVotes, setAwardVotes] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    if (!eventId) return
    let active = true
    fetchPublicEvent(eventId)
      .then((e) => {
        if (active) setSurveyUrl(e.survey_url)
      })
      .catch(() => {
        /* 未設定扱い（モック/サンプルモード・通信失敗時も壊さない） */
      })
    return () => {
      active = false
    }
  }, [eventId])

  useEffect(() => {
    if (!eventId || !userId) return
    let active = true
    setSurveyOpened(hasOpenedSurvey(eventId, userId))
    createParticipantClient()
      .getAwardVoteSnapshot(eventId, userId)
      .then((snap) => {
        if (!active) return
        setVotingOpen(snap.votingOpen)
        setAwardVotes(snap.votes)
      })
      .catch(() => {
        /* 取得できないときは導線を出したままにする（回収の機会を減らさない） */
      })
    return () => {
      active = false
    }
  }, [eventId, userId])

  const state = resolveReturnBannerState({ votingOpen, votes: awardVotes, surveyUrl, surveyOpened })

  return (
    <div className="legacy-home before-leaving-page container py-3 px-3">
      {surveyConfirmOpen && surveyUrl ? (
        <Modal titleId="survey-confirm-title" onClose={() => setSurveyConfirmOpen(false)} contentClassName="text-center">
          <h5 id="survey-confirm-title" className="modal-title">
            イベントアンケートを開きます
          </h5>
          <p className="modal-body-text">イベントアンケートのフォームを新しいタブで開きます。よろしいですか？</p>
          <div className="modal-footer-buttons">
            <button type="button" className="btn-custom-secondary" onClick={() => setSurveyConfirmOpen(false)}>
              キャンセル
            </button>
            <button
              type="button"
              className="btn-custom-primary-red"
              onClick={() => {
                window.open(surveyUrl, '_blank', 'noopener,noreferrer')
                if (eventId && userId) {
                  markSurveyOpened(eventId, userId)
                  setSurveyOpened(true)
                }
                setSurveyConfirmOpen(false)
              }}
            >
              はい
            </button>
          </div>
        </Modal>
      ) : null}

      <header className="before-leaving-header">
        <div className="before-leaving-emoji" aria-hidden="true">
          👋
        </div>
        <h1 className="before-leaving-title">お帰りの前に</h1>
        <p className="before-leaving-lead">
          ご来場ありがとうございました！
          <br />
          お帰りの前に、<strong>下の2つに必ずご協力ください。</strong>
        </p>
      </header>

      <ol className="before-leaving-steps">
        <li className={`before-leaving-step${state.vote === 'open' ? ' is-todo' : ' is-done'}`}>
          <div className="before-leaving-step-head">
            <span className="before-leaving-step-no">1</span>
            <h2 className="before-leaving-step-title">
              <i className="bi bi-trophy me-1" aria-hidden="true" />
              アワード投票
            </h2>
            <span className="before-leaving-badge">
              {state.vote === 'open' ? '未投票' : state.vote === 'done' ? '投票済み ✓' : '受付終了'}
            </span>
          </div>
          <p className="before-leaving-step-text">良かったブースに投票して、アワードを決めましょう。</p>
          {state.vote === 'open' ? (
            <button type="button" className="before-leaving-cta" onClick={() => navigate('/award-vote')}>
              投票する
              <i className="bi bi-chevron-right ms-1" aria-hidden="true" />
            </button>
          ) : null}
        </li>

        <li className={`before-leaving-step${state.survey === 'open' ? ' is-todo' : ' is-done'}`}>
          <div className="before-leaving-step-head">
            <span className="before-leaving-step-no">2</span>
            <h2 className="before-leaving-step-title">
              <i className="bi bi-clipboard-check me-1" aria-hidden="true" />
              イベント後アンケート
            </h2>
            <span className="before-leaving-badge">
              {state.survey === 'open' ? '未回答' : state.survey === 'opened' ? '開きました' : '準備中'}
            </span>
          </div>
          <p className="before-leaving-step-text">今後のイベント改善のため、ご意見をお聞かせください。</p>
          {/* 一度開いたあとも押せるままにする（外部フォームの回答状況は分からない。surveyOpenedFlag.ts） */}
          {state.survey ? (
            <button type="button" className="before-leaving-cta" onClick={() => setSurveyConfirmOpen(true)}>
              {state.survey === 'opened' ? 'もう一度開く' : 'アンケートに答える'}
              <i className="bi bi-box-arrow-up-right ms-1" aria-hidden="true" />
            </button>
          ) : null}
        </li>
      </ol>

      <button type="button" className="btn-custom-secondary w-100 mt-3" onClick={() => navigate('/home')}>
        ホームへ戻る
      </button>
    </div>
  )
}
