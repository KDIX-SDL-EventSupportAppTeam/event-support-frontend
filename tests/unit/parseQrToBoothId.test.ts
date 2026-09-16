import { describe, expect, it } from 'vitest'
import { parseQrToBoothId } from '@/features/checkin/lib/parseQrToBoothId'

const BOOTH_ID = '20000000-0000-4000-8000-000000000021'
const BOOTH_ID_UPPER = BOOTH_ID.toUpperCase()

describe('parseQrToBoothId', () => {
  it.each([
    ['クエリのみ', `https://example.com/checkin?booth_id=${BOOTH_ID}`],
    ['他パラメータと混在', `https://example.com/checkin?utm_source=poster&booth_id=${BOOTH_ID}&ref=qr`],
    ['末尾スラッシュ付き', `https://example.com/checkin/?booth_id=${BOOTH_ID}`],
  ])('URL形式(%s) → uuid', (_label, url) => {
    expect(parseQrToBoothId(url)).toBe(BOOTH_ID)
  })

  it('生のUUID文字列 → そのUUID', () => {
    expect(parseQrToBoothId(BOOTH_ID)).toBe(BOOTH_ID)
  })

  it('前後に空白がある生のUUID文字列 → trimされたUUID', () => {
    expect(parseQrToBoothId(`  ${BOOTH_ID}  `)).toBe(BOOTH_ID)
  })

  it('大文字UUID → 大文字のまま返す（ケース保持）', () => {
    expect(parseQrToBoothId(BOOTH_ID_UPPER)).toBe(BOOTH_ID_UPPER)
  })

  it.each([
    ['booth_id無しのURL', 'https://example.com/checkin?utm_source=poster'],
    ['非UUID文字列', 'not-a-uuid'],
    ['ゴミ文字列', '@@@---###'],
    ['空文字', ''],
  ])('%s → null', (_label, input) => {
    expect(parseQrToBoothId(input)).toBeNull()
  })

  it('T-8 undefined / null → null', () => {
    expect(parseQrToBoothId(undefined)).toBeNull()
    expect(parseQrToBoothId(null)).toBeNull()
  })

  it('T-9 他イベントの URL 形式でも booth_id があれば取れる', () => {
    expect(parseQrToBoothId(`https://other-event.example.org/e/xyz/checkin?booth_id=${BOOTH_ID}`)).toBe(BOOTH_ID)
  })

  it('T-10 URL パースに失敗する文字列でも正規表現フォールバックで取れる', () => {
    expect(parseQrToBoothId(`checkin?booth_id=${BOOTH_ID}`)).toBe(BOOTH_ID)
  })

  it('T-5 URL 形式でも前後の空白が trim される', () => {
    expect(parseQrToBoothId(`  https://example.com/checkin?booth_id=${BOOTH_ID}  `)).toBe(BOOTH_ID)
  })
})
