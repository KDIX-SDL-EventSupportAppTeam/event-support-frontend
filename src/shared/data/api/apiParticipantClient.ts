import { postV1CheckIn } from '@/shared/api/v1Participant'
import type { ParticipantClient } from '@/shared/data/participantTypes'
import { SAMPLE_QA_ITEMS } from '@/shared/data/sample/sampleQa'
import { SAMPLE_SCHEDULE } from '@/shared/data/sample/sampleSchedule'

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
      booth: {
        booth_id: data.booth.id,
        name: data.booth.name,
        emoji: DEFAULT_CHECKIN_EMOJI,
      },
    }
  }

  // ガチャコインは features/gachapon/api/gachaClient.ts に移設した（このクライアントは扱わない）。
  // アワード投票は準備中（event-support-server/docs/specs/gacha-and-award/ の対象外）。
  async getAwardVoteSnapshot() {
    return { votingOpen: false, awards: [], checkedBooths: [], votes: {} }
  }

  async saveVotes(): Promise<void> {
    /* 準備中 */
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
