/**
 * ブース番号（`display_code`）から `public/booth/image/` のブースイメージ（モーダル表示用の
 * 大きい写真）を引く。`boothIcon.ts`（一覧・ビンゴ盤用の平面アイコン）とは別の素材で、
 * 役割も違う。
 *
 * - **アイコン**（`boothIcon.ts`）: ブース一覧・ビンゴ盤の未訪問マスで使う「目印」
 * - **イメージ**（ここ）: ブース詳細モーダルを開いたときに大きく出す「写真」
 *
 * 素材の一覧と受領の経緯: docs/reference/assets.md「booth」
 * サーバーは画像の URL を返さない。考え方は boothIcon.ts と同じ
 * （AGENTS.md「フロントで計算しない」はここでは関係ない。表示素材の在り処を解決しているだけ）。
 */

/**
 * `public/booth/image/` に実在する番号。
 * ファイルを足したらここにも足す。`tests/unit/booth-image.test.ts` が突き合わせる。
 */
export const BOOTH_IMAGE_NUMBERS: readonly number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
  27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
]

const AVAILABLE = new Set(BOOTH_IMAGE_NUMBERS)

/** 全角数字を半角に寄せる（運営が全角で登録した番号を拾えるようにする） */
function toHalfWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
}

/**
 * `display_code` をイメージの番号として解釈する。
 * 数字だけの番号（`7` / `07` / `０７`）のみ対応し、`A-3` のような番号は `null`。
 */
export function boothImageNumber(displayCode: string | null | undefined): number | null {
  if (!displayCode) return null
  const normalized = toHalfWidthDigits(displayCode.trim())
  if (!/^\d+$/.test(normalized)) return null
  const n = Number(normalized)
  return AVAILABLE.has(n) ? n : null
}

/** ブースイメージの絶対パス。素材が無ければ `null` */
export function boothImageSrc(displayCode: string | null | undefined): string | null {
  const n = boothImageNumber(displayCode)
  return n === null ? null : `/booth/image/booth-${String(n).padStart(2, '0')}.png`
}
