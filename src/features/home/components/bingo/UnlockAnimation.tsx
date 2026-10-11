import { useEffect, useRef, useState } from 'react'
import {
  UNLOCK_MODAL_AUTO_CLOSE_MS,
  UNLOCK_MODAL_BUTTON_ENABLE_MS,
  UNLOCK_MODAL_IMAGE,
  unlockModalMessage,
} from '@/features/home/components/bingo/unlockModalCopy'

type Props = {
  /** 今回の解放で開いた外周マスの position（`unlocked_positions` / `released_positions`）。 */
  positions: number[]
  onDone: () => void
}

/**
 * 外周マス解放の通知モーダル（1回分）。
 * 仕様: docs/specs/bingo-dynamic-unlock/02-unlock-animation.md
 *
 * 解放は最大3回起きるため、1回分だけを描画する。呼び出し側が `pair_key` ごとに
 * 未再生の解放イベントをキューにして、1つずつこのコンポーネントを表示する。
 * バーストアニメーションは廃止し、静止画1枚＋文言＋「閉じる」の構成にした（issue #148）。
 * 自動クローズは残す（操作を無期限に奪わないため。02-unlock-animation.md「起きてはいけないこと」）。
 */
export function UnlockAnimation({ positions, onDone }: Props) {
  const [closable, setClosable] = useState(false)

  // onDone は親のレンダーごとに作り直される。依存に入れると親が再レンダーされるたびに
  // タイマーが両方リセットされ、閉じられなくなる（issue #193: CheckInPage はクールダウンで毎秒再レンダー）。
  // 最新の関数だけ ref で参照し、タイマーは表示した最初の1回だけ仕込む。
  // キューの次の解放は呼び出し側が key={pairKey} で作り直して表示する。
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const enableTimer = window.setTimeout(() => setClosable(true), UNLOCK_MODAL_BUTTON_ENABLE_MS)
    const closeTimer = window.setTimeout(() => onDoneRef.current(), UNLOCK_MODAL_AUTO_CLOSE_MS)
    return () => {
      window.clearTimeout(enableTimer)
      window.clearTimeout(closeTimer)
    }
  }, [])

  const count = positions.length

  return (
    <div
      className="modal-overlay bingo-unlock-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bingo-unlock-title"
    >
      {/* 装飾。情報は文言側に持たせる（既存の modal-popup-image と同じ扱い） */}
      <img src={UNLOCK_MODAL_IMAGE} alt="" className="bingo-unlock-image" decoding="async" />
      <div className="text-center bingo-unlock-message">
        <p id="bingo-unlock-title" className="fs-4 fw-bold mb-1">
          新しいマスが開きました
        </p>
        <p className="mb-3">{unlockModalMessage(count)}</p>
        {/* 最初から同じ位置・同じ大きさで置き、disabled を外すだけにする（押し間違い防止） */}
        <button type="button" className="btn btn-light" onClick={onDone} disabled={!closable}>
          閉じる
        </button>
      </div>
    </div>
  )
}
