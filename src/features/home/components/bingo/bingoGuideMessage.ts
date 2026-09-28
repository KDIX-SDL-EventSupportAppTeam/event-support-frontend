import type { BingoCard, BingoCell } from '@/shared/types/bingoCard'

/**
 * ビンゴカード上部の誘導文（1行）。
 * 仕様: docs/specs/bingo-dynamic-unlock/01-card-display.md「次に何をすればよいかを伝える」
 * issue #146（中央マスを埋めることを促す）／#147（サマリ削除後もこの1行は残す）
 *
 * ## 「フロントで計算しない」原則との関係（issue #146 の判断）
 *
 * ここで出す「あと1マスで何マス開くか」は、**進捗の再計算ではなく次の行動の案内文**である。
 * 進捗（`center_achieved` / `revealed_cells` / `achieved_cells` / `lines_completed`）は
 * サーバーのレスポンスをそのまま使い、数え直していない。開くマス数は
 * server `docs/specs/bingo-dynamic-unlock/03-card-lifecycle/unlock-pairs.md` の
 * **固定の対応表**（何回目の中央達成で何マス開くか）を文言に写しているだけで、
 * 解放状態そのものはサーバーの `is_revealed` / `unlock_events` を正としている。
 * したがって「推薦結果・集計値・進捗をフロントで計算し直さない」（docs/rules/coding.md）には反しない。
 *
 * ## 出さないもの
 *
 * - **推薦理由文**（01-card-display.md「推薦理由文は出さない。サーバーも返さない」）。
 *   出すのは行動の案内であって理由の説明ではない
 * - 行数を増やす情報。ホームは1画面に収める（issue #147）ので**この1行に集約する**
 */

/** 中央マスの総数。この数を前提に unlock-pairs.md の対応表を引く。 */
const CENTER_TOTAL = 4

/**
 * 「次の中央マスを1つ埋めたときに開く外周マス数」。
 * 正本: server `docs/specs/bingo-dynamic-unlock/03-card-lifecycle/unlock-pairs.md`
 * （中央の残り3マス → 2マス / 残り2マス → 4マス / 残り1マス → 6マス）
 */
const RELEASED_BY_CENTER_REMAINING: Record<number, number> = { 3: 2, 2: 4, 1: 6 }

/** 次の中央マス達成で開く外周マス数。分からない・開かないときは 0。 */
export function nextReleasedCount(centerAchieved: number, centerTotal: number): number {
  // 中央の総数が想定（4）と違うイベントでは対応表を引けないので数字を出さない
  if (centerTotal !== CENTER_TOTAL) return 0
  const remaining = centerTotal - centerAchieved
  return RELEASED_BY_CENTER_REMAINING[remaining] ?? 0
}

/** 未達成の事前推薦マス（`source = 'PRESURVEY'`）。無ければ null。 */
export function pendingPresurveyCell(cells: BingoCell[]): BingoCell | null {
  return cells.find((c) => c.source === 'PRESURVEY' && !c.is_achieved) ?? null
}

/**
 * カード上部に出す誘導文（1行）。
 *
 * 優先順は「事前推薦マスの名指し」→「中央を埋めると何マス開くか」→「開いたマスへの導線」。
 * 事前推薦マスを最後まで残す参加者が出ると 6 マスが最後まで開かないため、
 * また研究上その訪問が目的であるため、名指しを最優先にする（issue #146）。
 */
export function bingoGuideMessage(card: BingoCard): string {
  const released = nextReleasedCount(card.progress.center_achieved, card.progress.center_total)
  const presurvey = pendingPresurveyCell(card.cells)
  const presurveyName = presurvey?.booth?.name ?? null

  if (presurveyName) {
    return released > 0
      ? `おすすめの「${presurveyName}」を埋めると${released}マス開きます`
      : `あなたへのおすすめは「${presurveyName}」。行ってみよう`
  }

  // 中央マスは1つ埋まるたびに解放が起きるので、残り数にかかわらず「あと1マス」で正しい
  if (released > 0) return `中央のマスをあと1つ埋めると${released}マス開きます`

  if (card.progress.center_achieved >= card.progress.center_total) {
    return '開いたマスのブースに行ってみよう'
  }

  return '気になるブースを回ってみよう'
}
