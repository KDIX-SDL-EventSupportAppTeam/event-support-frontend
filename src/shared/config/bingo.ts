/**
 * ビンゴの目標ライン数。ステッパー（`BingoProgressStepper`）が「1〜4」の図で示す上限であり、
 * 「すべてのビンゴを達成した」と言えるのはこの本数に届いたときである。
 *
 * **ガチャの上限枚数（`MAX_GACHAPON_COINS`）とは別物として持つ。**
 * 確定値（1枚/ライン・上限4）では同じ数になるが、ビンゴの見せ方をガチャの設定から決めると
 * 依存の向き（`ガチャ → ビンゴ` は禁止。server `docs/specs/gacha-and-award/README.md`）を
 * 踏み外す。issue #149 で踏んだのがまさにこの間違いだった。
 */
export const BINGO_GOAL_LINES = 4
