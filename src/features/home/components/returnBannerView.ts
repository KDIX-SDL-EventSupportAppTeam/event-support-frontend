/**
 * ホーム下部「お帰りの前に」バナーの状態（issue #151）。
 * 仕様: docs/specs/design-refresh-2026/04-home-and-bingo.md
 *
 * **閉会式を待たずに早く帰る参加者から、アワード投票とイベントアンケートを回収する**ための
 * 常時表示の導線。ボタンを2つ並べて行数を増やさず、1枚のカードに収める
 * （ホームは1画面に収める。issue #147）。
 */

/** アワード投票の導線の状態。 */
export type VoteLinkState =
  /** 未投票・受付中。押せる */
  | 'open'
  /** 投票済み。押せない */
  | 'done'
  /** 受付終了。押せない */
  | 'closed'

/**
 * イベントアンケートの導線の状態。`null` は `survey_url` が無く出さない。
 *
 * **`'opened'` でもリンクは押せる。** 外部フォームの回答状況は分からないので
 * （`shared/lib/surveyOpenedFlag.ts`）、`'opened'` は「開きました」という控えめな印にだけ使う。
 * **分からないものを済み扱いにして入口を閉じてはいけない**（開いただけで回答していない
 * 参加者がアンケートに辿り着けなくなる。issue #151 の目的＝早期帰宅者からの回収に逆行する）。
 */
export type SurveyLinkState = 'open' | 'opened' | null

export type ReturnBannerState = {
  /**
   * バナー自体を出すか。
   *
   * **アンケートの導線がある限り出す。** 畳むのは、アワード投票が押せず（投票済み・受付終了＝
   * どちらもサーバーが返す事実）かつ `survey_url` が無いときだけ。
   */
  visible: boolean
  vote: VoteLinkState
  survey: SurveyLinkState
}

export function resolveReturnBannerState(args: {
  /** `GET /awards/vote` の `voting_open`。取得できていなければ null（受付中として扱う） */
  votingOpen: boolean | null
  /** `GET /awards/vote` の `votes`。1件でもあれば投票済み。取得できていなければ null */
  votes: Record<string, string> | null
  /** イベント情報の `survey_url`。無ければアンケートの導線を出さない */
  surveyUrl: string | null
  /** この端末でアンケートを開いたか */
  surveyOpened: boolean
}): ReturnBannerState {
  const voted = args.votes != null && Object.keys(args.votes).length > 0
  // 投票済みの表示を優先する（締切後に投票済みの人へ「受付終了」と出しても意味が無い）
  const vote: VoteLinkState = voted ? 'done' : args.votingOpen === false ? 'closed' : 'open'
  const survey: SurveyLinkState = args.surveyUrl ? (args.surveyOpened ? 'opened' : 'open') : null

  // アワード投票が押せる、またはアンケートの導線がある限りバナーを出す。
  // アンケートは一度開いたあとも押せるので、survey が 'opened' でも畳まない。
  const voteActionable = vote === 'open'
  return { visible: voteActionable || survey !== null, vote, survey }
}
