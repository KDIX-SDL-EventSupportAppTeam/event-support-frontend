import type { Award } from '@/types/award'
import type { BingoGridCell, LegacyBooth } from '@/types/legacyBooth'
import {
  buildRandomBingoGrid,
  countCompletedBingoLines,
  hashSeed,
  mulberry32,
} from '@/data/sample/bingoRandom'
import { SAMPLE_LEGACY_BOOTHS } from '@/data/sample/sampleBooths'
import { readSampleExtraCheckedIds, readSampleGachaponExtraSpent } from '@/data/sample/sampleSession'

const SAMPLE_AWARDS: Award[] = [
  { id: 'award-1', name: '来場者投票', description: '当日投票で決定' },
  { id: 'award-2', name: 'スタッフ賞', description: '運営おすすめ' },
]

export function pickCheckedInBoothIds(booths: LegacyBooth[], eventId: string, userId: string): string[] {
  if (booths.length === 0) return []
  const rng = mulberry32(hashSeed(`${eventId}|${userId}|checkin`))
  const maxPick = Math.min(booths.length, 4)
  const count = Math.max(1, Math.min(maxPick, 2 + Math.floor(rng() * 3)))
  const set = new Set<string>()
  let guard = 0
  while (set.size < count && guard++ < 64) {
    set.add(booths[Math.floor(rng() * booths.length)]!.booth_id)
  }
  return [...set]
}

export class SampleEventData {
  getLegacyBooths(): LegacyBooth[] {
    return SAMPLE_LEGACY_BOOTHS.map((b) => ({ ...b }))
  }

  getCheckedInBoothIds(eventId: string, userId: string): string[] {
    const base = pickCheckedInBoothIds(SAMPLE_LEGACY_BOOTHS, eventId, userId)
    const extra = readSampleExtraCheckedIds(userId)
    return [...new Set([...base, ...extra])]
  }

  bingoGridFor(eventId: string, userId: string): BingoGridCell[] {
    return buildRandomBingoGrid(SAMPLE_LEGACY_BOOTHS, `${eventId}|${userId}|bingocard`)
  }

  getBingoGrid(eventId: string, userId: string): BingoGridCell[] {
    return this.bingoGridFor(eventId, userId).map((c) => (c === null ? null : { ...c }))
  }

  getBingoCount(eventId: string, userId: string): number {
    const grid = this.bingoGridFor(eventId, userId)
    const checked = new Set(this.getCheckedInBoothIds(eventId, userId))
    return Math.min(4, countCompletedBingoLines(grid, checked))
  }

  getGachaponBaseSpent(eventId: string, userId: string): number {
    const lines = this.getBingoCount(eventId, userId)
    const rng = mulberry32(hashSeed(`${eventId}|${userId}|gacha`))
    if (lines === 0) return 0
    return Math.min(lines, Math.floor(rng() * (lines + 1)))
  }

  getGachaponCoinsSpent(eventId: string, userId: string): number {
    const lines = this.getBingoCount(eventId, userId)
    const base = this.getGachaponBaseSpent(eventId, userId)
    const extra = readSampleGachaponExtraSpent(userId)
    return Math.min(lines, base + extra)
  }

  getAwards(): Award[] {
    return SAMPLE_AWARDS.map((a) => ({ ...a }))
  }
}
