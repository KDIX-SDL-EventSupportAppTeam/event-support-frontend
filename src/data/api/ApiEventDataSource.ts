import { fetchV1Booths, fetchV1Checkins } from '@/api/v1Participant'
import { buildRandomBingoGrid, countCompletedBingoLines } from '@/data/sample/bingoRandom'
import { mapV1BoothListItemToLegacy } from '@/data/api/mapV1Booth'
import type { EventDataSource } from '@/data/EventDataSource'

/** Fastify `/api/v1` から参加者データを取得する（ビンゴは v1 未実装のためクライアント側で組み立て） */
export class ApiEventDataSource implements EventDataSource {
  async getLegacyBooths(eventId: string) {
    const booths = await fetchV1Booths(eventId)
    return booths.map(mapV1BoothListItemToLegacy)
  }

  async getCheckedInBoothIds(eventId: string, _userId: string) {
    void _userId
    const checkins = await fetchV1Checkins(eventId)
    return checkins.map((c) => c.booth_id)
  }

  async getBingoGrid(eventId: string, userId: string) {
    const booths = await this.getLegacyBooths(eventId)
    return buildRandomBingoGrid(booths, `${eventId}:${userId}`)
  }

  async getBingoCount(eventId: string, userId: string) {
    const [booths, checked] = await Promise.all([
      this.getLegacyBooths(eventId),
      this.getCheckedInBoothIds(eventId, userId),
    ])
    const grid = buildRandomBingoGrid(booths, `${eventId}:${userId}`)
    return countCompletedBingoLines(grid, new Set(checked))
  }

  async getGachaponCoinsSpent(_eventId: string, _userId: string) {
    void _eventId
    void _userId
    return 0
  }

  async getAwards(_eventId: string) {
    void _eventId
    return []
  }
}
