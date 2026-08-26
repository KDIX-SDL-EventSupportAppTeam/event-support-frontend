/**
 * ビンゴカード動的段階解放方式の型。
 *
 * サーバー仕様の正本: `event-support-server/docs/specs/bingo-dynamic-unlock/06-api/participant-api.md`
 * フロント仕様: `docs/specs/bingo-dynamic-unlock/01-card-display.md`
 *
 * マスは `is_revealed` / `is_achieved` の2軸。`is_revealed: false` のとき `booth` は必ず `null`。
 * 推薦理由文（`reason`）はサーバーが返さないため、この型には無い。
 */
export type BingoCellZone = 'CENTER' | 'OUTER'
export type BingoCellSource = 'PRESURVEY' | 'FREE_VISIT' | 'RECOMMEND' | null

export type BingoCellBooth = { id: string; name: string; manual_code: string; description: string }

export type BingoCell = {
  position: number // 0..15（行優先）
  zone: BingoCellZone
  is_revealed: boolean
  is_achieved: boolean
  source: BingoCellSource
  booth: BingoCellBooth | null // is_revealed: false では必ず null
}

export type BingoCardProgress = {
  center_achieved: number
  center_total: number
  revealed_cells: number
  achieved_cells: number
}

/** `pair_key` は `5-6` のようなハイフン区切り（小さい position が先）。6種類のみ存在する。 */
export type BingoUnlockEvent = {
  pair_key: string
  released_positions: number[]
  unlocked_at: string
}

export type BingoCard = {
  card_id: string
  rating_scale: number
  progress: BingoCardProgress
  lines_completed: number
  unlock_events: BingoUnlockEvent[]
  cells: BingoCell[] // position 昇順で必ず16件
}
