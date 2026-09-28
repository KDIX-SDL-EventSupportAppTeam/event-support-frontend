import type { BingoCell } from '@/shared/types/bingoCard'
import { BoothIcon } from '@/shared/components/booth/BoothIcon'

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
 * - `is_revealed: true, is_achieved: false`: 開いているが未訪問。ブースアイコン + ブース名
 * - `is_revealed: true, is_achieved: true`: 達成。ブースアイコン + ブース名 + スタンプ画像
 *
 * ブースアイコン（`public/booth/`）は番号が振られているブースにだけ存在する。
 * 素材が無いマスはアイコン無しのままブース名だけを出す（docs/reference/assets.md「booth」）。
 *
 * 例外として `is_revealed: true` かつ `booth: null` があり得る（サーバー側 E7:
 * INSUFFICIENT_CANDIDATES = 割り当て可能なブースが残っていないまま解放されたマス）。
 * このマスは**そのユーザーに未訪問の有効ブースが残っていない＝全部回りきった終点**なので、
 * 「すべてのブースを訪問しました」と伝え、達成マスと同じスタンプで描く。
 * **タップできる**（開くモーダルで、なぜブース名が無いのかを説明する）。
 *
 * 注意: 「有効ブースがカードのマス数を下回る」ケース（運営都合のブース数不足）とは
 * 意味が正反対だが、**サーバーが両者を区別するフィールドを返すのは
 * event-support-server#150 以降**。それまでは全制覇として扱う。
 */
export function BingoCellView({ cell, onTap }: Props) {
  // 割り当て可能なブースが残っていなかったマス（is_revealed かつ booth: null）。
  // 「全部回りきった」という意味なので、ブース名が無いことの説明をモーダルで出す
  const isAllVisited = cell.is_revealed && !cell.booth
  // 開いているマスはタップできる。ブース名が無いマスも、空のモーダルではなく説明を出す
  const tappable = cell.is_revealed
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
    isAllVisited ? 'bingo-cell-all-visited' : '',
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
          {/* 達成マスはスタンプが絵柄の役目を果たすので、アイコンは未達成のマスにだけ出す。
              1マスに両方入れるとマスが小さく（4列）名前まで収まらない */}
          {!cell.is_achieved ? (
            <BoothIcon displayCode={cell.booth.display_code} className="bingo-cell-booth-icon" />
          ) : null}
          <span className="bingo-cell-booth-name">{cell.booth.name}</span>
        </>
      ) : (
        <>
          {/* サーバーが訪問済み扱い（is_achieved）で返すので、達成マスと同じスタンプで描く */}
          {cell.is_achieved ? (
            <img src="/bingo/bingo-cell-stamp.png" alt="達成" className="bingo-cell-stamp" aria-hidden />
          ) : null}
          <span className="bingo-cell-all-visited-text">すべてのブースを訪問しました</span>
        </>
      )}
    </div>
  )
}
