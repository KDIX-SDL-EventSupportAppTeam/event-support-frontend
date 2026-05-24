import { apiClient } from '@/shared/api/client'
import { unwrapApiData } from '@/shared/api/unwrap'
import type { ApiResponse } from '@/shared/types/api'

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

export type V1CheckInResponse = {
  checkin_id: string
  booth: { id: string; name: string }
  synced_at: string
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

export async function postV1CheckInRating(
  eventId: string,
  checkinId: string,
  rating: number,
): Promise<void> {
  const res = await apiClient.post<ApiResponse<{ rating_id: string }>>(
    `/events/${encodeURIComponent(eventId)}/checkins/${encodeURIComponent(checkinId)}/rating`,
    { rating },
  )
  unwrapApiData(res)
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
