/**
 * ビンゴカード段階解放方式の型。
 *
 * `src/shared/types/legacyBooth.ts` の `BingoGridCell` とは別系統。
 * サーバー仕様: `event-support-server/docs/.sdd/06-api/participant-api.md`
 * フロント仕様: `docs/.sdd/05-state-api/types-and-client.md`
 *
 * `booth` は `state === 'LOCKED'` のとき必ず `null`。
 * `reason` は生成ロジック未決定のため当面 `null`（docs/.sdd/06-open-questions/open-questions.md Q-F3）。
 */
export type BingoCellState = 'LOCKED' | 'EMPTY' | 'ACHIEVED'
export type BingoCellZone = 'CENTER' | 'OUTER'
export type BingoCellSource = 'SIGNUP_BONUS' | 'FREE_VISIT' | 'RECOMMEND'

export type BingoCellReason = { summary: string; detail: string }

export type BingoCellBooth = { id: string; name: string; manual_code: string }

export type BingoCell = {
  position: number // 0..15（行優先）
  zone: BingoCellZone
  state: BingoCellState
  source: BingoCellSource | null
  booth: BingoCellBooth | null // LOCKED では必ず null
  reason: BingoCellReason | null // 当面は null
}

export type BingoCardStatus = 'CENTER_ONLY' | 'UNLOCKED'

export type BingoCardProgress = {
  center_filled: number
  center_total: number
  visits_to_unlock: number
}

export type BingoCardCoins = { earned: number; max: number }

export type BingoCard = {
  card_id: string
  status: BingoCardStatus
  unlocked_at: string | null
  rating_scale: number
  progress: BingoCardProgress
  coins: BingoCardCoins
  cells: BingoCell[] // position 昇順で必ず16件
}
