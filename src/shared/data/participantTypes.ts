import type { LegacyBooth } from '@/shared/types/legacyBooth'
import type { QaItem, ScheduleDay } from '@/shared/types/eventContent'
import type { CheckInResult } from '@/shared/types/checkin'
import type { Award } from '@/shared/types/award'

export type AwardVoteSnapshot = {
  votingOpen: boolean
  awards: Award[]
  checkedBooths: LegacyBooth[]
  /** キーは award_id、値は booth_id（未投票の賞はキーごと無い）。issue #89 */
  votes: Record<string, string>
}

/** チェックイン・投票・スケジュール・Q&A（旧 Flask / サンプル）。
 *  ガチャコインは features/gachapon/api/gachaClient.ts が担う。 */
export interface ParticipantClient {
  postCheckIn(eventId: string, userId: string, boothId: string): Promise<CheckInResult>
  getAwardVoteSnapshot(eventId: string, userId: string): Promise<AwardVoteSnapshot>
  /** 全票を1回で送る。null は取り消し。戻り値は保存後スナップショット（付け替え・復元用）。 */
  saveVotes(
    eventId: string,
    userId: string,
    votes: Record<string, string | null>,
  ): Promise<AwardVoteSnapshot>
  getSchedule(): Promise<ScheduleDay[]>
  getQa(): Promise<QaItem[]>
}
