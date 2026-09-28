import { boothIconSrc } from '@/shared/lib/boothIcon'
import '@/shared/components/booth/booth-icon.scss'

type Props = {
  /** ブース番号（サーバーの `display_code`）。素材が無ければ `fallback` を出す */
  displayCode: string | null | undefined
  /** 素材が無いときに出すもの（多くの場合 `booth_emoji`）。省略時は何も出さない */
  fallback?: string
  /** 箱の一辺。`--pf-booth-icon-size` に入る CSS の長さ */
  size?: string
  className?: string
}

/**
 * ブースアイコン。**ブース詳細を開くための目印**として一覧・ビンゴ盤・運営画面で共用する。
 * 素材と対応の経緯: docs/reference/assets.md「booth」
 *
 * 素材は透明余白の量がまちまちなので、**固定の正方形＋`object-fit: contain`** で描く
 * （`icon/**` と同じ考え方。docs/decisions/adrs/0005-icon-canvas-normalization.md）。
 *
 * 装飾なので `alt=""`。ブース名は必ず隣に文字で出ている前提。
 */
export function BoothIcon({ displayCode, fallback, size, className }: Props) {
  const src = boothIconSrc(displayCode)
  const classes = ['booth-icon', className].filter(Boolean).join(' ')
  const style = size ? ({ '--pf-booth-icon-size': size } as React.CSSProperties) : undefined

  if (!src) {
    if (!fallback) return null
    return (
      <span className={`${classes} booth-icon--fallback`} style={style} aria-hidden>
        {fallback}
      </span>
    )
  }
  return <img src={src} alt="" className={classes} style={style} loading="lazy" aria-hidden />
}
