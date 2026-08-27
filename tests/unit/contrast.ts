// WCAG 2.1 のコントラスト比計算ヘルパー。
// design-tokens.test.ts 専用。本番コード（src/）では使わない。

/** #rrggbb / #rgb 形式の16進カラーコードを [r, g, b]（0-255）へ変換する */
function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.trim().replace(/^#/, '')
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`不正なカラーコード: ${hex}`)
  }

  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return [r, g, b]
}

/** sRGB の 1 チャンネル（0-255）を相対輝度計算用の線形値へ変換する */
function channelToLinear(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

/** WCAG 2.1 の相対輝度（relative luminance）を計算する */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  const [rl, gl, bl] = [channelToLinear(r), channelToLinear(g), channelToLinear(b)]
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

/** WCAG 2.1 のコントラスト比 (L1+0.05)/(L2+0.05) を計算する（L1 が明るい方） */
export function contrastRatio(colorA: string, colorB: string): number {
  const la = relativeLuminance(colorA)
  const lb = relativeLuminance(colorB)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/** SCSS ファイルの内容から `--pf-*: 値;` の CSS カスタムプロパティを抽出する */
export function extractCssCustomProperties(scssContent: string): Record<string, string> {
  const result: Record<string, string> = {}
  const pattern = /(--pf-[a-z0-9-]+)\s*:\s*([^;]+);/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(scssContent)) !== null) {
    result[match[1]] = match[2].trim()
  }
  return result
}

/** SCSS ファイルの内容から `$name: 値;` の SCSS 変数を抽出する */
export function extractScssVariables(scssContent: string): Record<string, string> {
  const result: Record<string, string> = {}
  const pattern = /\$([a-z0-9-]+)\s*:\s*([^;]+);/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(scssContent)) !== null) {
    result[match[1]] = match[2].trim()
  }
  return result
}
