import { countCompletedBingoLines } from '@/shared/data/sample/bingoRandom'
import type { ParticipantClient } from '@/shared/data/participantTypes'
import { pickCheckedInBoothIds, SampleEventData } from '@/shared/data/sample/SampleEventData'
import { SAMPLE_LEGACY_BOOTHS } from '@/shared/data/sample/sampleBooths'
import { QA_2026, SCHEDULE_2026 } from '@/shared/data/content/eventContent2026'
import {
  appendSampleCheckedId,
  readSampleExtraCheckedIds,
  readSampleVotes,
  startSampleCooldown,
  writeSampleVotes,
} from '@/shared/data/sample/sampleSession'
import { SAMPLE_VOTE_AWARDS } from '@/shared/data/sample/sampleVoteAwards'
import type { CheckInResult } from '@/shared/types/checkin'
import { recordBingoCelebration } from '@/shared/lib/bingoCelebration'

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

    appendSampleCheckedId(userId, booth.booth_id)

    const afterSet = new Set<string>([...pickIds, ...readSampleExtraCheckedIds(userId)])
    const rawAfter = countCompletedBingoLines(grid, afterSet)

    const newlyCompletedLines = Math.max(0, rawAfter - rawBefore)

    startSampleCooldown(userId, 45_000)

    recordBingoCelebration(newlyCompletedLines)

    return {
      checkin_id: `sample-${booth.booth_id}`,
      booth: {
        booth_id: booth.booth_id,
        name: booth.booth_name,
        emoji: booth.booth_emoji,
      },
    }
  }

  async getAwardVoteSnapshot(eventId: string, userId: string) {
    const checkedIds = new Set(this.sample.getCheckedInBoothIds(eventId, userId))
    const checkedBooths = SAMPLE_LEGACY_BOOTHS.filter((b) => checkedIds.has(b.booth_id))
    const persisted = readSampleVotes(userId)
    // キーは award_id（issue #89）。チェックイン済みでない票は落とす（サーバーと同じ扱い）
    const votes: Record<string, string> = {}
    for (const a of SAMPLE_VOTE_AWARDS) {
      const boothId = persisted[a.id]
      if (boothId && checkedIds.has(boothId)) votes[a.id] = boothId
    }
    return {
      votingOpen: true,
      awards: SAMPLE_VOTE_AWARDS.map((a) => ({ ...a })),
      checkedBooths: checkedBooths.map((b) => ({ ...b })),
      votes,
    }
  }

  async saveVotes(eventId: string, userId: string, votes: Record<string, string | null>) {
    const next: Record<string, string> = {}
    for (const [awardId, boothId] of Object.entries(votes)) {
      if (boothId) next[awardId] = boothId
    }
    writeSampleVotes(userId, next)
    return this.getAwardVoteSnapshot(eventId, userId)
  }

  async getSchedule() {
    return SCHEDULE_2026.map((d) => ({
      dayTitle: d.dayTitle,
      events: d.events.map((e) => ({ ...e })),
    }))
  }

  async getQa() {
    return QA_2026.map((q) => ({ ...q }))
  }
}
