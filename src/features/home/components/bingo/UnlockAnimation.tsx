import { useEffect } from 'react'

type Props = {
  /** 今回の解放で開いた外周マスの position（`unlocked_positions` / `released_positions`）。 */
  positions: number[]
  onDone: () => void
}

/**
 * 外周マス解放演出（1回分）。
 * 仕様: docs/specs/bingo-dynamic-unlock/02-unlock-animation.md
 *
 * 解放は最大3回起きるため、1回分の演出だけを描画する。呼び出し側が
 * `pair_key` ごとに未再生の解放イベントをキューにして、1つずつこのコンポーネントを表示する。
 * スキップ可能。演出中も操作を完全にブロックしない（オーバーレイのボタンは常に押せる）。
 */
export function UnlockAnimation({ positions, onDone }: Props) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 2200)
    return () => window.clearTimeout(timer)
  }, [onDone])

  const count = positions.length

  return (
    <div className="modal-overlay bingo-unlock-overlay" role="dialog" aria-modal="true" aria-label="ビンゴカード解放演出">
      <div className="bingo-unlock-burst" aria-hidden>
        {positions.map((position, i) => (
          <span key={position} className="bingo-unlock-piece" style={{ animationDelay: `${i * 40}ms` }} />
        ))}
      </div>
      <div className="text-center bingo-unlock-message">
        <p className="fs-4 fw-bold mb-1">新しいマスが開きました！</p>
        <p className="mb-3">外周{count}マスが解放されました</p>
        <button type="button" className="btn btn-light" onClick={onDone}>
          スキップ
        </button>
      </div>
    </div>
  )
}
