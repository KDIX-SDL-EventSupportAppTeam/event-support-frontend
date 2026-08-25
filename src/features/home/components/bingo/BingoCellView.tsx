import type { BingoCell } from '@/shared/types/bingoCard'

type Props = {
  cell: BingoCell
  onTap: (cell: BingoCell) => void
}

/**
 * ビンゴカードの1マス表示。
 * 仕様: docs/specs/bingo-dynamic-unlock/01-card-display.md
 *
 * - `is_revealed: false`: 閉じたマス。「？」のみ（サーバーが `booth: null` で返すため中身を補完しない）
 * - `is_revealed: true, is_achieved: false`: 開いているが未訪問。ブース名 + 説明
 * - `is_revealed: true, is_achieved: true`: 達成。ブース名 + 達成マーク
 *
 * 例外として `is_revealed: true` かつ `booth: null` があり得る（サーバー側 E7:
 * INSUFFICIENT_CANDIDATES = 推薦候補が足りず対象ブースを決められないまま解放されたマス）。
 * 01-card-display.md にこのケースの表示指定は無いため、空白＋タップ可能（不具合に見える）を避ける
 * 目的で「ブース未定」と分かる穏当な文言を出し、タップ導線からは外す判断をした。
 */
export function BingoCellView({ cell, onTap }: Props) {
  // 対象ブースが決まらなかったマス（is_revealed かつ booth: null）はタップしても
  // 中身が空のモーダルが開くだけなので、タップ導線から外す
  const tappable = cell.is_revealed && Boolean(cell.booth)
  const isPresurvey = cell.source === 'PRESURVEY'

  const classes = [
    'bingo-cell-v2',
    cell.is_revealed ? (cell.is_achieved ? 'bingo-cell-achieved' : 'bingo-cell-revealed') : 'bingo-cell-locked',
    `bingo-cell-zone-${cell.zone.toLowerCase()}`,
    isPresurvey ? 'bingo-cell-presurvey' : '',
    cell.is_revealed && !cell.booth ? 'bingo-cell-undecided' : '',
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
      {!cell.is_revealed ? (
        <span className="bingo-cell-locked-mark" aria-label="未解放">
          ?
        </span>
      ) : cell.booth ? (
        <>
          {cell.is_achieved ? <i className="bi bi-check-circle-fill bingo-cell-check" aria-hidden /> : null}
          <span className="bingo-cell-booth-name">{cell.booth.name}</span>
        </>
      ) : (
        <span className="bingo-cell-undecided-text">ブースが決まりませんでした</span>
      )}
    </div>
  )
}
