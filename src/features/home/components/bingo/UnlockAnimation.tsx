import { useEffect } from 'react'

type Props = { onDone: () => void }

/**
 * 外側12マス解放演出。
 * 仕様: docs/.sdd/02-bingo-card/unlock-animation.md
 *
 * Q-F5（未決定）: ビジュアルの細部は実装者判断。ここでは「中央から外側へ広がる」ことが
 * 分かる程度の軽量な CSS アニメーションのみとし、当日 13:30-15:30 の集中発火を考慮して
 * 重い演出は入れない。スキップ可能。
 */
export function UnlockAnimation({ onDone }: Props) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 2200)
    return () => window.clearTimeout(timer)
  }, [onDone])

  return (
    <div className="modal-overlay bingo-unlock-overlay" role="dialog" aria-modal="true" aria-label="ビンゴカード解放演出">
      <div className="bingo-unlock-burst" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="bingo-unlock-piece" style={{ animationDelay: `${i * 40}ms` }} />
        ))}
      </div>
      <div className="text-center bingo-unlock-message">
        <p className="fs-4 fw-bold mb-1">カードが広がりました！</p>
        <p className="mb-3">外側12マスが解放されました</p>
        <button type="button" className="btn btn-light" onClick={onDone}>
          スキップ
        </button>
      </div>
    </div>
  )
}
