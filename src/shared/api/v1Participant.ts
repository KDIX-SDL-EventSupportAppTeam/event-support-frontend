import { apiClient } from '@/shared/api/client'
import { unwrapApiData } from '@/shared/api/unwrap'
import type { ApiResponse } from '@/shared/types/api'
import type { BingoCard } from '@/shared/types/bingoCard'

export type V1BoothListItem = {
  id: string
  name: string
  manual_code: string | null
  description: string
  category: { id: string; name: string } | null
  tags: string[]
  labels: string[]
  checkin_count: number
  avg_rating: number | null
  is_checked_in: boolean
}

export type V1BoothDetail = {
  id: string
  name: string
  labels: string[]
  stats: {
    checkin_count_total: number
    checkin_count_last_10min: number
    checkin_count_last_30min: number
    avg_rating: number | null
    avg_stay_minutes: number | null
  }
  is_checked_in: boolean
}

export type V1CheckinItem = {
  id: string
  booth_id: string
  booth_name: string
  method: string
  checked_in_at: string
  synced_at: string | null
}

export async function fetchV1Booths(eventId: string, categoryId?: string): Promise<V1BoothListItem[]> {
  const res = await apiClient.get<ApiResponse<{ booths: V1BoothListItem[] }>>(
    `/events/${encodeURIComponent(eventId)}/booths`,
    { params: categoryId ? { category_id: categoryId } : undefined },
  )
  return unwrapApiData(res).booths
}

export async function fetchV1BoothDetail(eventId: string, boothId: string): Promise<V1BoothDetail> {
  const res = await apiClient.get<ApiResponse<V1BoothDetail>>(
    `/events/${encodeURIComponent(eventId)}/booths/${encodeURIComponent(boothId)}`,
  )
  return unwrapApiData(res)
}

export async function fetchV1Checkins(eventId: string): Promise<V1CheckinItem[]> {
  const res = await apiClient.get<ApiResponse<{ checkins: V1CheckinItem[] }>>(
    `/events/${encodeURIComponent(eventId)}/checkins`,
  )
  return unwrapApiData(res).checkins
}

/**
 * ビンゴ動的段階解放対応後のチェックインレスポンス。
 * API 契約の正本: event-support-server `docs/specs/bingo-dynamic-unlock/06-api/participant-api.md`
 */
/** 解放イベント1件。`pair_key` は `5-9` のようなハイフン区切り（小さい position が先）。 */
export type V1UnlockedPair = { pair_key: string; released_positions: number[] }

export type V1CheckInResponse = {
  checkin_id: string
  booth: { id: string; name: string }
  synced_at: string
  /** COOLDOWN の残り秒数（既定 CHECKIN_COOLDOWN_SEC=0 では 0） */
  cooldown_remaining_sec: number
  /** 今回のチェックインで埋まったマス。カード外訪問なら null */
  filled_cell: { position: number } | null
  /** 今回の解放で開放された外周 position の配列（全ペア分が平坦に混ざる）。解放が起きなければ空配列 */
  unlocked_positions: number[]
  /**
   * 今回の解放をペアごとに分けたもの。中央3・4マス目の達成では複数ペアが同時成立するため、
   * 演出の単位（`pair_key`）はここから取る。`unlocked_positions` からの逆引きはしない。
   */
  unlocked_pairs: V1UnlockedPair[]
  /** 今回のチェックインで新たに成立したライン数 */
  new_lines: number
  /** 成立ライン数の合計 */
  lines_completed: number
  /** 直前に評価が未回収のブースがあれば非 null（評価モーダルの先頭ステップ用） */
  pending_rating: { checkin_id: string; booth_id: string; booth_name: string } | null
}

export async function postV1CheckIn(
  eventId: string,
  body:
    | { method: 'qr'; booth_id: string; checked_in_at: string }
    | { method: 'manual'; manual_code: string; checked_in_at: string },
): Promise<V1CheckInResponse> {
  const res = await apiClient.post<ApiResponse<V1CheckInResponse>>(
    `/events/${encodeURIComponent(eventId)}/checkins`,
    body,
  )
  return unwrapApiData(res)
}

/** 評価の送信文脈。既定は手動評価（マスタップ導線 / チェックイン履歴からの導線）。 */
export type V1RatingContext = 'NEXT_CHECKIN' | 'MANUAL'

export async function postV1CheckInRating(
  eventId: string,
  checkinId: string,
  rating: number,
  comment?: string,
  context: V1RatingContext = 'MANUAL',
): Promise<void> {
  const trimmed = comment?.trim()
  const res = await apiClient.post<ApiResponse<{ rating_id: string }>>(
    `/events/${encodeURIComponent(eventId)}/checkins/${encodeURIComponent(checkinId)}/rating`,
    { rating, context, ...(trimmed ? { comment: trimmed } : {}) },
  )
  unwrapApiData(res)
}

/**
 * 動的段階解放ビンゴカードを取得する。
 * 仕様: docs/specs/bingo-dynamic-unlock/01-card-display.md
 */
export async function fetchV1BingoCard(eventId: string): Promise<BingoCard> {
  const res = await apiClient.get<ApiResponse<BingoCard>>(`/events/${encodeURIComponent(eventId)}/bingo/card`)
  return unwrapApiData(res)
}
