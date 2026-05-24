import type { Award } from '@/shared/types/award'
import type { BingoGridCell, LegacyBooth } from '@/shared/types/legacyBooth'

export type EventDataSourceMode = 'sample' | 'api'

/**
 * 参加者向けイベントデータ（旧 UI 契約）。
 * 実装はサンプル固定と REST の2系統に分離し、`createEventDataSource()` で切替。
 */
export interface EventDataSource {
  /** ブース一覧（`/booth-list`） */
  getLegacyBooths(eventId: string): Promise<LegacyBooth[]>
  /** チェックイン済みブース ID（`/api/checked-in-booths` 相当） */
  getCheckedInBoothIds(eventId: string, userId: string): Promise<string[]>
  /** 4x4 ビンゴカード（`/api/bingo-booths` 相当） */
  getBingoGrid(eventId: string, userId: string): Promise<BingoGridCell[]>
  /** ビンゴ達成数（コイン表示用・`/api/bingo-status` 相当） */
  getBingoCount(eventId: string, userId: string): Promise<number>
  /** ガチャで消費済みコイン枚数 */
  getGachaponCoinsSpent(eventId: string, userId: string): Promise<number>
  /** 賞一覧（投票画面等で利用予定） */
  getAwards(eventId: string): Promise<Award[]>
}
