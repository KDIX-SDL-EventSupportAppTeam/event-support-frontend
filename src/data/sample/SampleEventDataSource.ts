import type { EventDataSource } from '@/data/EventDataSource'
import { SampleEventData } from '@/data/sample/SampleEventData'

/** `SampleEventData` のみ参照。HTTP やルーターに依存しない */
export class SampleEventDataSource implements EventDataSource {
  private readonly sample = new SampleEventData()

  async getLegacyBooths(_eventId: string) {
    void _eventId
    return this.sample.getLegacyBooths()
  }

  async getCheckedInBoothIds(eventId: string, userId: string) {
    return this.sample.getCheckedInBoothIds(eventId, userId)
  }

  async getBingoGrid(eventId: string, userId: string) {
    return this.sample.getBingoGrid(eventId, userId)
  }

  async getBingoCount(eventId: string, userId: string) {
    return this.sample.getBingoCount(eventId, userId)
  }

  async getGachaponCoinsSpent(eventId: string, userId: string) {
    return this.sample.getGachaponCoinsSpent(eventId, userId)
  }

  async getAwards(_eventId: string) {
    void _eventId
    return this.sample.getAwards()
  }
}
