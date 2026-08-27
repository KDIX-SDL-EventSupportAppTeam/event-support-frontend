import type { LegacyBooth } from '@/shared/types/legacyBooth'
import type { QaItem, ScheduleDay } from '@/shared/types/eventContent'
import type { CheckInResult } from '@/shared/types/checkin'
import type { VoteAwardCategory } from '@/shared/types/voteAward'

export type AwardVoteSnapshot = {
  votingOpen: boolean
  awards: VoteAwardCategory[]
  checkedBooths: LegacyBooth[]
  votes: Record<string, string | null>
}

/** チェックイン・投票・スケジュール・Q&A（旧 Flask / サンプル）。
 *  ガチャコインは features/gachapon/api/gachaClient.ts が担う。 */
export interface ParticipantClient {
  postCheckIn(eventId: string, userId: string, boothId: string): Promise<CheckInResult>
  getAwardVoteSnapshot(eventId: string, userId: string): Promise<AwardVoteSnapshot>
  saveVotes(userId: string, votes: Record<string, string | null>): Promise<void>
  getSchedule(): Promise<ScheduleDay[]>
  getQa(): Promise<QaItem[]>
}
