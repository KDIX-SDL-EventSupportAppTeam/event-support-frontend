import { useState } from 'react'
import type { BingoCellReason } from '@/shared/types/bingoCard'

type Props = { reason: BingoCellReason | null }

/**
 * マスタップ時の理由文表示。
 * 仕様: docs/.sdd/02-bingo-card/reason-text.md
 *
 * Q-F3（未決定）: 理由文の生成ロジックはサーバー側で未確定。
 * ここでは受け渡されたサーバー文字列をそのまま表示するのみで、
 * `reason === null` のあいだはセクション自体を出さない（プレースホルダも出さない）。
 */
export function ReasonPanel({ reason }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!reason) return null

  return (
    <div className="bingo-reason-panel text-start mt-3">
      <p className="bingo-reason-summary mb-1 fw-semibold">{reason.summary}</p>
      {expanded ? <p className="bingo-reason-detail small text-muted mb-1">{reason.detail}</p> : null}
      <button
        type="button"
        className="btn btn-link btn-sm p-0"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? '閉じる' : 'もっと見る'}
      </button>
    </div>
  )
}
