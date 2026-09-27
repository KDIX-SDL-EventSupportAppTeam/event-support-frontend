/**
 * ビンゴ達成モーダル・コイン満タンモーダルの見せ方を決める純関数。
 * 仕様: docs/specs/design-refresh-2026/05-modals.md、issue #149
 *
 * ここに切り出す理由は2つ。
 * - 判定が `gachaCoins` に戻らないことをテストで固定できる（依存の向き `ガチャ → ビンゴ` は禁止。
 *   server `docs/specs/gacha-and-award/README.md`「絶対に守る依存の向き」）
 * - vitest は `environment: 'node'` で画面を描画しないため、判定だけを純関数にしないと固定できない
 */

/**
 * ビンゴ達成モーダルに出す本数。
 *
 * 正は **ビンゴのデータ**（カードの `lines_completed`）。フロントで数え直してはいないので
 * 「フロントで計算しない」に反しない（サーバーが返した値をそのまま出す）。
 * カードがまだ届いていないときだけ、チェックイン画面から受け取った成立本数で代替する。
 * どちらも無ければ `null`（本数なしの文言で出す）。
 */
export function resolveBingoCelebrationLines(
  cardLinesCompleted: number | null | undefined,
  newLines: number,
): number | null {
  if (typeof cardLinesCompleted === 'number' && cardLinesCompleted > 0) return cardLinesCompleted
  if (newLines > 0) return newLines
  return null
}

/**
 * コイン満タンモーダルに専用アートを出すか。
 *
 * 4本目のビンゴではビンゴ達成とコイン満タンが同時に成立するため、両方アートで出すと
 * 全画面のアート付きモーダルが2枚続く（issue #149）。**ビンゴ達成を優先し**、
 * 同じ来訪でビンゴ達成モーダルを出したときはコイン満タン側を文言だけに落とす。
 * モーダル自体を消さないのは、コインが使えるようになったことは別の情報であり、
 * `hasSeenCoinComplete` が「一度だけ」を保証しているため出す機会が他に無いから。
 */
export function shouldShowCoinCompleteArt(bingoCelebrationShown: boolean): boolean {
  return !bingoCelebrationShown
}
