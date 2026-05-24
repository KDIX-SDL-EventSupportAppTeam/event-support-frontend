import axios from 'axios'
import { legacyApi } from '@/shared/api/legacyHttp'
import type { Award } from '@/shared/types/award'
import type { BingoGridCell, LegacyBooth } from '@/shared/types/legacyBooth'
import type { CheckInResult } from '@/shared/types/checkin'
import type { VoteAwardCategory } from '@/shared/types/voteAward'

/** 同一オリジンの `/checkin` 等（Vite プロキシで Flask へ） */
export const legacySiteApi = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
})

/** 旧 `GET /api/all-booths` — レスポンスは JSON 配列そのもの */
export async function fetchLegacyAllBooths(): Promise<LegacyBooth[]> {
  const { data } = await legacyApi.get<LegacyBooth[]>('/api/all-booths')
  return data
}

export async function fetchCheckedInBoothIds(userId: string): Promise<string[]> {
  const { data } = await legacyApi.get<string[]>('/api/checked-in-booths', {
    params: { userId },
  })
  return data
}

export async function fetchBingoBooths(userId: string): Promise<BingoGridCell[]> {
  const { data } = await legacyApi.get<BingoGridCell[]>('/api/bingo-booths', {
    params: { userId },
  })
  return data
}

export async function fetchBingoStatusFull(userId: string): Promise<{
  bingoCount: number
  gachaponCoinsSpent: number
}> {
  const { data } = await legacyApi.get<{ bingoCount?: number; gachaponCoinsSpent?: number }>('/api/bingo-status', {
    params: { userId },
  })
  return {
    bingoCount: Number(data.bingoCount ?? 0),
    gachaponCoinsSpent: Number(data.gachaponCoinsSpent ?? 0),
  }
}

/** 未実装の場合は空配列。将来 `/api/awards` 等に合わせて変更 */
export async function fetchLegacyAwards(): Promise<Award[]> {
  try {
    const { data } = await legacyApi.get<{ awards: Award[] } | Award[]>('/api/awards')
    if (Array.isArray(data)) {
      return data.map((a) => ({
        id: String((a as Award).id ?? (a as Award).name),
        name: (a as Award).name,
        description: (a as Award).description,
      }))
    }
    return data.awards
  } catch {
    return []
  }
}

export async function postUseGachaponCoin(userId: string): Promise<void> {
  await legacyApi.post('/api/use-gachapon-coin', { userId })
}

export async function fetchCooldownStatus(userId: string): Promise<{
  in_cooldown: boolean
  remaining_time: number
}> {
  const { data } = await legacyApi.get<{ in_cooldown?: boolean; remaining_time?: number }>('/api/cooldown-status', {
    params: { userId },
  })
  return {
    in_cooldown: Boolean(data.in_cooldown),
    remaining_time: Math.max(0, Number(data.remaining_time ?? 0)),
  }
}

export async function postLegacyCheckIn(boothId: string, userId: string): Promise<CheckInResult> {
  const { data } = await legacySiteApi.post<{
    checkedInBooth: { name: string; emoji?: string }
    newlyCompletedLines?: number
    newCoinsAwarded?: number
  }>('/checkin', { boothId, userId })
  const booth = data.checkedInBooth
  return {
    checkin_id: `legacy-${boothId}`,
    booth: {
      booth_id: boothId,
      name: booth.name,
      emoji: booth.emoji ?? '🎪',
    },
  }
}

export async function fetchVotingStatus(): Promise<boolean> {
  const { data } = await legacyApi.get<{ is_open?: boolean }>('/api/voting-status')
  return data.is_open !== false
}

function normalizeVoteAwards(raw: unknown): VoteAwardCategory[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((x) => {
      const o = x as Record<string, unknown>
      const name = String(o.name ?? o.id ?? '')
      const description = String(o.description ?? '')
      const color = typeof o.color === 'string' ? o.color : 'pink'
      return { name, description, color }
    })
    .filter((a) => a.name.length > 0)
}

export async function fetchVoteAwardCategories(): Promise<VoteAwardCategory[]> {
  const { data } = await legacyApi.get<unknown>('/api/awards')
  if (Array.isArray(data)) return normalizeVoteAwards(data)
  if (data && typeof data === 'object' && 'awards' in data) {
    return normalizeVoteAwards((data as { awards: unknown }).awards)
  }
  return []
}

export async function fetchUserCheckedInBoothDetails(userId: string): Promise<LegacyBooth[]> {
  const { data } = await legacyApi.get<LegacyBooth[]>('/api/user-checked-in-booth-details', {
    params: { userId },
  })
  return Array.isArray(data) ? data : []
}

export async function fetchUserVotes(userId: string): Promise<Record<string, string | null>> {
  const { data } = await legacyApi.get<Record<string, string | null>>('/api/user-votes', {
    params: { userId },
  })
  return data && typeof data === 'object' ? data : {}
}

export async function postVotesUpdate(userId: string, votes: Record<string, string | null>): Promise<void> {
  await legacyApi.post('/api/votes/update', { userId, votes })
}
