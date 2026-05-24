import { countCompletedBingoLines } from '@/shared/data/sample/bingoRandom'
import type { ParticipantClient } from '@/shared/data/participantTypes'
import { pickCheckedInBoothIds, SampleEventData } from '@/shared/data/sample/SampleEventData'
import { SAMPLE_LEGACY_BOOTHS } from '@/shared/data/sample/sampleBooths'
import { SAMPLE_QA_ITEMS } from '@/shared/data/sample/sampleQa'
import { SAMPLE_SCHEDULE } from '@/shared/data/sample/sampleSchedule'
import {
  appendSampleCheckedId,
  incrementSampleGachaponExtraSpent,
  readSampleExtraCheckedIds,
  readSampleVotes,
  startSampleCooldown,
  writeSampleVotes,
} from '@/shared/data/sample/sampleSession'
import { SAMPLE_VOTE_AWARDS } from '@/shared/data/sample/sampleVoteAwards'
import type { CheckInResult } from '@/shared/types/voteAward'

export class SampleParticipantClient implements ParticipantClient {
  private readonly sample = new SampleEventData()

  async postCheckIn(eventId: string, userId: string, boothId: string): Promise<CheckInResult> {
    const trimmed = boothId.trim()
    const booth = SAMPLE_LEGACY_BOOTHS.find(
      (b) => b.booth_id === trimmed || b.booth_id.toUpperCase() === trimmed.toUpperCase(),
    )
    if (!booth) {
      throw new Error('このQRコードはイベントのブースとして認識できませんでした。')
    }

    const grid = this.sample.bingoGridFor(eventId, userId)
    const pickIds = pickCheckedInBoothIds(SAMPLE_LEGACY_BOOTHS, eventId, userId)
    const beforeSet = new Set<string>([...pickIds, ...readSampleExtraCheckedIds(userId)])
    const rawBefore = countCompletedBingoLines(grid, beforeSet)
    const bingoBefore = Math.min(4, rawBefore)

    appendSampleCheckedId(userId, booth.booth_id)

    const afterSet = new Set<string>([...pickIds, ...readSampleExtraCheckedIds(userId)])
    const rawAfter = countCompletedBingoLines(grid, afterSet)
    const bingoAfter = Math.min(4, rawAfter)

    const newCoinsAwarded = Math.max(0, bingoAfter - bingoBefore)
    const newlyCompletedLines = Math.max(0, rawAfter - rawBefore)

    startSampleCooldown(userId, 45_000)

    if (newlyCompletedLines > 0) {
      sessionStorage.setItem('newlyCompletedLines', String(newlyCompletedLines))
      sessionStorage.setItem('newCoinsAwarded', String(newCoinsAwarded))
    }

    return {
      checkin_id: `sample-${booth.booth_id}`,
      checkedInBooth: {
        id: booth.booth_id,
        name: booth.booth_name,
        emoji: booth.booth_emoji,
      },
    }
  }

  async getAvailableGachaponCoins(eventId: string, userId: string): Promise<number> {
    const lines = this.sample.getBingoCount(eventId, userId)
    const spent = this.sample.getGachaponCoinsSpent(eventId, userId)
    return Math.max(0, lines - spent)
  }

  async postUseGachaponCoin(eventId: string, userId: string): Promise<void> {
    const lines = this.sample.getBingoCount(eventId, userId)
    const base = this.sample.getGachaponBaseSpent(eventId, userId)
    const ok = incrementSampleGachaponExtraSpent(userId, lines, base)
    if (!ok) {
      throw new Error('使用できるコインがありません。')
    }
  }

  async getAwardVoteSnapshot(eventId: string, userId: string) {
    void eventId
    const checkedIds = new Set(this.sample.getCheckedInBoothIds(eventId, userId))
    const checkedBooths = SAMPLE_LEGACY_BOOTHS.filter((b) => checkedIds.has(b.booth_id))
    const persisted = readSampleVotes(userId)
    const votes: Record<string, string | null> = {}
    for (const a of SAMPLE_VOTE_AWARDS) {
      votes[a.name] = persisted[a.name] ?? null
    }
    return {
      votingOpen: true,
      awards: SAMPLE_VOTE_AWARDS.map((a) => ({ ...a })),
      checkedBooths: checkedBooths.map((b) => ({ ...b })),
      votes,
    }
  }

  async saveVotes(userId: string, votes: Record<string, string | null>): Promise<void> {
    writeSampleVotes(userId, { ...votes })
  }

  async getSchedule() {
    return SAMPLE_SCHEDULE.map((d) => ({
      dayTitle: d.dayTitle,
      events: d.events.map((e) => ({ ...e })),
    }))
  }

  async getQa() {
    return SAMPLE_QA_ITEMS.map((q) => ({ ...q }))
  }
}
