import { postV1CheckIn } from '@/shared/api/v1Participant'
import { fetchAwardVoteSnapshot, postAwardVotes } from '@/shared/api/v1Awards'
import type { ParticipantClient } from '@/shared/data/participantTypes'
import { QA_2026, SCHEDULE_2026 } from '@/shared/data/content/eventContent2026'

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
  async getAwardVoteSnapshot(eventId: string, _userId: string) {
    void _userId
    return fetchAwardVoteSnapshot(eventId)
  }

  async saveVotes(eventId: string, _userId: string, votes: Record<string, string | null>) {
    void _userId
    return postAwardVotes(eventId, votes)
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
