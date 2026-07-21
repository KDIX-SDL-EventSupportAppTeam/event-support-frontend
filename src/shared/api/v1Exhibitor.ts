import { apiClient } from '@/shared/api/client'
import { unwrapApiData } from '@/shared/api/unwrap'
import type { ApiResponse } from '@/shared/types/api'

export type ExhibitorBooth = { id: string; name: string }
export type ExhibitorBoothsResult = { is_exhibitor: boolean; booths: ExhibitorBooth[] }

export type ExhibitorBoothStats = {
  booth: { id: string; name: string }
  total_checkins: number
  hourly_checkins: { time_slot: string; count: number }[] // "10:00" 形式（server #53 §5-2）
  ratings: {
    count: number
    avg_rating: number | null
    distribution: Record<number, number> // {1..5: 件数}
  }
  comments: { id: string; rating: number; comment: string; rated_at: string }[]
}

export async function fetchExhibitorBooths(eventId: string): Promise<ExhibitorBoothsResult> {
  const res = await apiClient.get<ApiResponse<ExhibitorBoothsResult>>(
    `/events/${encodeURIComponent(eventId)}/exhibitor/booths`,
  )
  return unwrapApiData(res)
}

export async function fetchExhibitorBoothStats(
  eventId: string,
  boothId: string,
): Promise<ExhibitorBoothStats> {
  const res = await apiClient.get<ApiResponse<ExhibitorBoothStats>>(
    `/events/${encodeURIComponent(eventId)}/exhibitor/booths/${encodeURIComponent(boothId)}/stats`,
  )
  return unwrapApiData(res)
}
