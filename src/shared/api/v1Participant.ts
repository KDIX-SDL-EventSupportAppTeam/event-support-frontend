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
 * ビンゴ段階解放対応後のチェックインレスポンス。
 * 仕様: docs/.sdd/03-checkin-flow/checkin-result.md
 */
export type V1CheckInResponse = {
  checkin_id: string
  booth: { id: string; name: string }
  synced_at: string
  /** COOLDOWN の残り秒数（既定 CHECKIN_COOLDOWN_SEC=0 では 0） */
  cooldown_remaining_sec: number
  /** 今回のチェックインでカードのどのマスが埋まったか（カード外訪問や解放前の追加訪問では null） */
  filled_cell: { position: number } | null
  /** 直前に評価が未回収のブースがあれば非 null（評価モーダルの先頭ステップ用） */
  pending_rating: { checkin_id: string; booth_id: string; booth_name: string } | null
  /** 今回のチェックインで外側12マスが解放されたか */
  unlocked: boolean
  new_lines: number
  coins_earned: number
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
 * 段階解放ビンゴカードを取得する。
 * 仕様: docs/.sdd/05-state-api/types-and-client.md
 */
export async function fetchV1BingoCard(eventId: string): Promise<BingoCard> {
  const res = await apiClient.get<ApiResponse<BingoCard>>(`/events/${encodeURIComponent(eventId)}/bingo/card`)
  return unwrapApiData(res)
}

export type V1RecommendationReason = 'recommend' | 'semi_recommend' | 'discovery'

export type V1RecommendationBooth = {
  id: string
  name: string
  labels: string[]
  reason: V1RecommendationReason
}

export type V1RecommendationsResponse = {
  recommendation_id: string
  algorithm: string
  booths: V1RecommendationBooth[]
}

export async function fetchV1Recommendations(eventId: string): Promise<V1RecommendationsResponse> {
  const res = await apiClient.get<ApiResponse<V1RecommendationsResponse>>(
    `/events/${encodeURIComponent(eventId)}/recommendations`,
  )
  return unwrapApiData(res)
}

export async function postV1SelectRecommendation(
  eventId: string,
  recommendationId: string,
  selectedBoothId: string,
): Promise<void> {
  const res = await apiClient.post<ApiResponse<Record<string, never>>>(
    `/events/${encodeURIComponent(eventId)}/recommendations/${encodeURIComponent(recommendationId)}/select`,
    { selected_booth_id: selectedBoothId },
  )
  unwrapApiData(res)
}

const REASON_LABELS: Record<V1RecommendationReason, string> = {
  recommend: 'おすすめ',
  semi_recommend: 'ややおすすめ',
  discovery: '新しい発見',
}

export function v1RecommendationReasonLabel(reason: V1RecommendationReason): string {
  return REASON_LABELS[reason] ?? reason
}
