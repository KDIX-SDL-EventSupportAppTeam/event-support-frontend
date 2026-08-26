/**
 * ライン成立演出（ホームの「🎉 BINGO!」モーダル）への受け渡し。
 * 仕様: docs/specs/bingo-dynamic-unlock/03-checkin-flow.md
 *
 * ガチャは準備中のため、コインの表示・計算は行わない（04-removals.md）。
 * チェックインレスポンスの `new_lines` をそのまま渡す。
 */
const LINES_KEY = 'newlyCompletedLines'

/** 今回のチェックインでラインが成立していれば、ホーム側の演出用に記録する。 */
export function recordBingoCelebration(newLines: number): void {
  if (newLines <= 0) return
  sessionStorage.setItem(LINES_KEY, String(newLines))
}

/** ホーム側で1回だけ読み出す（読んだら消す）。 */
export function consumeBingoCelebration(): { lines: number } {
  const lines = Number.parseInt(sessionStorage.getItem(LINES_KEY) ?? '0', 10)
  sessionStorage.removeItem(LINES_KEY)
  return { lines: Number.isFinite(lines) ? lines : 0 }
}
