import type { ReturnBannerState } from '@/features/home/components/returnBannerView'

type Props = {
  state: ReturnBannerState
  onVote: () => void
  /** アンケートは確認モーダルを経由するので、ここでは確認を開くだけ（window.open を直呼びしない）。 */
  onOpenSurveyConfirm: () => void
}

/**
 * ホーム下部「お帰りの前に」バナー（issue #151）。
 *
 * 早く帰る参加者からアワード投票とイベントアンケートを回収するため**常時表示**する。
 * 1枚のカードに2リンクを収め、行数を増やさない（ホームは1画面に収める。issue #147）。
 * 見出しに「閉会式を待たずに」とは書かない（離脱を促してしまう）。
 *
 * 下部5列グリッドの「アプリフィードバック」（アプリ改善用フォーム）とは別物。混ぜない。
 */
export function ReturnBeforeLeavingBanner({ state, onVote, onOpenSurveyConfirm }: Props) {
  if (!state.visible) return null

  return (
    <div className="row g-2 mt-2">
      <div className="col-12">
        <section className="return-banner" aria-labelledby="return-banner-title">
          <h2 id="return-banner-title" className="return-banner-title">
            お帰りの前に
          </h2>
          <ul className="return-banner-links">
            <li>
              {state.vote === 'open' ? (
                <button type="button" className="btn btn-sub-action" onClick={onVote}>
                  <i className="bi bi-trophy me-1" aria-hidden="true" />
                  アワード投票
                </button>
              ) : (
                <span className="return-banner-done">
                  アワード投票
                  {state.vote === 'done' ? '（投票済み）' : '（受付終了）'}
                </span>
              )}
            </li>
            {state.survey ? (
              <li>
                {/*
                  一度開いたあとも**押せるままにする。** 外部フォームの回答状況は分からないので
                  （surveyOpenedFlag.ts）、「開きました」は控えめな印であって済み表示ではない。
                  ここを押せなくすると、開いただけで回答していない参加者が辿り着けなくなる。
                */}
                <button type="button" className="btn btn-sub-action" onClick={onOpenSurveyConfirm}>
                  <i className="bi bi-clipboard-check me-1" aria-hidden="true" />
                  イベントアンケート
                  {state.survey === 'opened' ? (
                    <span className="return-banner-hint">（開きました）</span>
                  ) : null}
                </button>
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  )
}
