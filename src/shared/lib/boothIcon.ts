/**
 * ブース番号（`display_code`）から `public/booth/` のブースアイコンを引く。
 *
 * 素材の一覧と受領の経緯: docs/reference/assets.md「booth」
 *
 * **サーバーはアイコンの URL を返さない。** 2026 年版の素材はアート担当が
 * ブース番号を付けた状態で届くため、フロント側で番号→ファイル名の対応だけを持つ。
 * 対応が無い番号（未受領の 21・37、番号未設定のブース、数字でない番号）は `null` を返し、
 * 呼び出し側は従来どおり絵文字などにフォールバックする。
 *
 * ここは「表示に使う静的ファイルの在り処」を解決しているだけで、
 * 集計や判定をフロントで計算しているわけではない（AGENTS.md「フロントで計算しない」）。
 */

/**
 * `public/booth/` に実在する番号。**21 と 37 は素材が未受領**（欠番）。
 * ファイルを足したらここにも足す。`tests/unit/booth-icon.test.ts` が突き合わせる。
 */
export const BOOTH_ICON_NUMBERS: readonly number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23, 24, 25, 26, 27,
  28, 29, 30, 31, 32, 33, 34, 35, 36, 38, 39,
]

const AVAILABLE = new Set(BOOTH_ICON_NUMBERS)

/** 全角数字を半角に寄せる（運営が全角で登録した番号を拾えるようにする） */
function toHalfWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
}

/**
 * `display_code` をアイコンの番号として解釈する。
 * 数字だけの番号（`7` / `07` / `０７`）のみ対応し、`A-3` のような番号は `null`。
 */
export function boothIconNumber(displayCode: string | null | undefined): number | null {
  if (!displayCode) return null
  const normalized = toHalfWidthDigits(displayCode.trim())
  if (!/^\d+$/.test(normalized)) return null
  const n = Number(normalized)
  return AVAILABLE.has(n) ? n : null
}

/** ブースアイコンの絶対パス。素材が無ければ `null` */
export function boothIconSrc(displayCode: string | null | undefined): string | null {
  const n = boothIconNumber(displayCode)
  return n === null ? null : `/booth/booth-${String(n).padStart(2, '0')}.png`
}
