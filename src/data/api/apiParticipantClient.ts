import { postV1CheckIn } from '@/api/v1Participant'
import {
  fetchBingoStatusFull,
  fetchUserCheckedInBoothDetails,
  fetchUserVotes,
  fetchVoteAwardCategories,
  fetchVotingStatus,
  postUseGachaponCoin as postUseGachaponCoinRequest,
  postVotesUpdate,
} from '@/api/legacyParticipant'
import type { ParticipantClient } from '@/data/participantTypes'
import { SAMPLE_QA_ITEMS } from '@/data/sample/sampleQa'
import { SAMPLE_SCHEDULE } from '@/data/sample/sampleSchedule'
import { SAMPLE_VOTE_AWARDS } from '@/data/sample/sampleVoteAwards'

const DEFAULT_CHECKIN_EMOJI = '🎪'

export class ApiParticipantClient implements ParticipantClient {
  async postCheckIn(eventId: string, _userId: string, boothId: string) {
    void _userId
    const data = await postV1CheckIn(eventId, {
      method: 'qr',
      booth_id: boothId,
      checked_in_at: new Date().toISOString(),
    })
    return {
      checkin_id: data.checkin_id,
      checkedInBooth: {
        id: data.booth.id,
        name: data.booth.name,
        emoji: DEFAULT_CHECKIN_EMOJI,
      },
    }
  }

  async getAvailableGachaponCoins(_eventId: string, userId: string): Promise<number> {
    void _eventId
    const s = await fetchBingoStatusFull(userId)
    return Math.max(0, s.bingoCount - s.gachaponCoinsSpent)
  }

  async postUseGachaponCoin(_eventId: string, userId: string): Promise<void> {
    void _eventId
    await postUseGachaponCoinRequest(userId)
  }

  async getAwardVoteSnapshot(eventId: string, userId: string) {
    void eventId
    const [votingOpen, rawAwards, checkedBooths, rawVotesUnknown] = await Promise.all([
      fetchVotingStatus().catch(() => true),
      fetchVoteAwardCategories().catch(() => []),
      fetchUserCheckedInBoothDetails(userId).catch(() => []),
      fetchUserVotes(userId).catch(() => ({})),
    ])
    const rawVotes = rawVotesUnknown as Record<string, string | null>
    const awards = rawAwards.length > 0 ? rawAwards : SAMPLE_VOTE_AWARDS.map((a) => ({ ...a }))
    const votes: Record<string, string | null> = {}
    for (const a of awards) {
      votes[a.name] = rawVotes[a.name] ?? null
    }
    return { votingOpen, awards, checkedBooths, votes }
  }

  async saveVotes(userId: string, votes: Record<string, string | null>): Promise<void> {
    await postVotesUpdate(userId, votes)
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
