import { BINGO_GOAL_LINES } from '@/shared/config/bingo'

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

/**
 * ビンゴ達成モーダルに出すアート。**本数で出し分ける**（issue #149 のレビュー）。
 *
 * `popup-bingo-complete.png` は絵の中に「ビンゴコンプリート！ / すべてのビンゴを達成しました！」が
 * 焼き込まれているため、1本目に出すと絵の文字が嘘になる。
 * 1〜3本目は文字の入っていない**ライン成立バッジ**（`docs/reference/assets.md`:
 * 「ビンゴ成立バッジ（星入りグリッド）」）を使い、目標本数に届いたときだけ一枚絵に切り替える。
 *
 * **判定はビンゴのデータだけで行う**（`lines_completed` と `BINGO_GOAL_LINES`）。
 * ガチャコインの枚数・上限は見ない。
 * 本数が分からないとき（`null`）はバッジ側に寄せる（達成していないのに「すべて達成」と言わない）。
 */
export function bingoCelebrationArt(lines: number | null): {
  src: string
  /** バッジは素材が小さいので、モーダル内で大きく引き伸ばさない。 */
  isBadge: boolean
} {
  const complete = lines != null && lines >= BINGO_GOAL_LINES
  return complete
    ? { src: '/feedback/popup-bingo-complete.png', isBadge: false }
    : { src: '/bingo/bingo-line-badge.png', isBadge: true }
}
