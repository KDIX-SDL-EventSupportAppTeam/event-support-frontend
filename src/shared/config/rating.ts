/**
 * 評価の段階数。4（中央値なし）で固定する（D-7）。
 * サーバーの `RATING_SCALE`（既定4）と一致させる。変えるときは両方変える。
 */
export const RATING_SCALE = 4

/**
 * 星表示用: 1〜scale の各星が塗られているかどうかを返す。
 * 例: rating=1, scale=4 → [true, false, false, false]
 */
export function starFillStates(rating: number, scale: number = RATING_SCALE): boolean[] {
  return Array.from({ length: scale }, (_, i) => rating >= i + 1)
}
