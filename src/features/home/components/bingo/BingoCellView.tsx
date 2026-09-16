import type { BingoCell } from '@/shared/types/bingoCard'

type Props = {
  cell: BingoCell
  onTap: (cell: BingoCell) => void
}

/**
 * ビンゴカードの1マス表示。
 * 仕様: docs/specs/bingo-dynamic-unlock/01-card-display.md
 *
 * - `is_revealed: false`: 閉じたマス。中身は出さない（サーバーが `booth: null` で返すため中身を補完しない）。
 *   2026年版デザインでは `--pf-surface` の地のみで視覚的なプレースホルダは置かない
 *   （docs/specs/design-refresh-2026/04-home-and-bingo.md）
 * - `is_revealed: true, is_achieved: false`: 開いているが未訪問。ブース名 + 説明
 * - `is_revealed: true, is_achieved: true`: 達成。ブース名 + スタンプ画像
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
  const isCenter = cell.zone === 'CENTER'
  // 中央マスは「後出し割当」でどのブースにチェックインしても即達成扱いになる（サーバー: assignCenterCell）。
  // 未解放の中央マスに事前推薦（PRESURVEY）以外の意味はなく、外周のような線ペア解放待ちではないため、
  // 外周と同じ「ロック」表現ではなく「好きなブースに回ってください」という誘導文にする
  // （docs/specs/design-refresh-2026/04-home-and-bingo.md 追補）
  const isCenterInvite = !cell.is_revealed && isCenter

  const classes = [
    'bingo-cell-v2',
    cell.is_revealed
      ? cell.is_achieved
        ? 'bingo-cell-achieved'
        : 'bingo-cell-revealed'
      : isCenterInvite
        ? 'bingo-cell-center-invite'
        : 'bingo-cell-locked',
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
      aria-label={
        cell.is_revealed ? undefined : isCenterInvite ? '好きなブースで埋まるマス' : '未解放のマス'
      }
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
        isCenterInvite ? (
          // 中央の空きマスは最大4つ並ぶ。命令文（「好きなブースに回ってください」）を
          // 各マスで繰り返すと同じ文が3〜4回並んで読みづらいため、
          // 命令文は盤上部の .bingo-unlock-guide に任せ、ここは枠の役割を示す短い名札にする
          <span className="bingo-cell-center-invite-text">好きなブース</span>
        ) : (
          <i className="bi bi-lock-fill bingo-cell-lock-icon" aria-hidden="true" />
        )
      ) : cell.booth ? (
        <>
          {cell.is_achieved ? (
            <img src="/bingo/bingo-cell-stamp.png" alt="達成" className="bingo-cell-stamp" aria-hidden />
          ) : null}
          <span className="bingo-cell-booth-name">{cell.booth.name}</span>
        </>
      ) : (
        <span className="bingo-cell-undecided-text">ブースが決まりませんでした</span>
      )}
    </div>
  )
}
