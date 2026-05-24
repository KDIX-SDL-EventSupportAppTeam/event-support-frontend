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

/** ガチャ・チェックイン・投票・スケジュール・Q&A（旧 Flask / サンプル） */
export interface ParticipantClient {
  postCheckIn(eventId: string, userId: string, boothId: string): Promise<CheckInResult>
  getAvailableGachaponCoins(eventId: string, userId: string): Promise<number>
  postUseGachaponCoin(eventId: string, userId: string): Promise<void>
  getAwardVoteSnapshot(eventId: string, userId: string): Promise<AwardVoteSnapshot>
  saveVotes(userId: string, votes: Record<string, string | null>): Promise<void>
  getSchedule(): Promise<ScheduleDay[]>
  getQa(): Promise<QaItem[]>
}
