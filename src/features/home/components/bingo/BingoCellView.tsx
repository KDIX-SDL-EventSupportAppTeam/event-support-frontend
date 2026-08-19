import type { BingoCell } from '@/shared/types/bingoCard'

type Props = {
  cell: BingoCell
  onTap: (cell: BingoCell) => void
}

/**
 * ビンゴカードの1マス表示。
 * 仕様: docs/.sdd/02-bingo-card/card-display.md
 *
 * - LOCKED: 枠と「?」のみ。ブース名は出さない（サーバーが返さない。中身を推測して埋めない）
 * - EMPTY (CENTER): 次の訪問が入る空きマス
 * - EMPTY (OUTER): 推薦ブース名を表示（未達成）
 * - ACHIEVED: 達成済み。参加ボーナスマスにはバッジを付ける
 */
export function BingoCellView({ cell, onTap }: Props) {
  const tappable = cell.state !== 'LOCKED'
  const isBonus = cell.source === 'SIGNUP_BONUS'

  const classes = [
    'bingo-cell-v2',
    `bingo-cell-${cell.state.toLowerCase()}`,
    `bingo-cell-zone-${cell.zone.toLowerCase()}`,
    isBonus ? 'bingo-cell-bonus' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      role={tappable ? 'button' : undefined}
      tabIndex={tappable ? 0 : undefined}
      className={classes}
      onClick={() => tappable && onTap(cell)}
      onKeyDown={(e) => {
        if (tappable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onTap(cell)
        }
      }}
    >
      {cell.state === 'LOCKED' ? (
        <span className="bingo-cell-locked-mark" aria-label="未解放">
          ?
        </span>
      ) : isBonus ? (
        <>
          <span className="bingo-cell-bonus-badge">参加ありがとう</span>
        </>
      ) : cell.state === 'EMPTY' && cell.zone === 'CENTER' ? (
        <span className="bingo-cell-empty-hint">次の訪問がここに</span>
      ) : cell.booth ? (
        <>
          {cell.state === 'ACHIEVED' ? <i className="bi bi-check-circle-fill bingo-cell-check" aria-hidden /> : null}
          <span className="bingo-cell-booth-name">{cell.booth.name}</span>
        </>
      ) : null}
    </div>
  )
}
