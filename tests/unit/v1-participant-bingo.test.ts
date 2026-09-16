import { describe, it, expect, vi } from 'vitest'

const getMock = vi.fn()
const postMock = vi.fn()

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
  },
}))

const { fetchV1BingoCard, postV1CheckInRating, postV1CheckIn } = await import('@/shared/api/v1Participant')

describe('fetchV1BingoCard', () => {
  it('/bingo/card から BingoCard を取り出す', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          card_id: 'card-1',
          rating_scale: 4,
          progress: { center_achieved: 1, center_total: 4, revealed_cells: 1, achieved_cells: 0 },
          lines_completed: 0,
          unlock_events: [],
          cells: [],
        },
      },
    })
    const card = await fetchV1BingoCard('evt-1')
    expect(getMock).toHaveBeenCalledWith('/events/evt-1/bingo/card')
    expect(card.card_id).toBe('card-1')
    expect(card.rating_scale).toBe(4)
    // coins / status はもう来ない
    expect(card).not.toHaveProperty('coins')
    expect(card).not.toHaveProperty('status')
  })
})

describe('postV1CheckIn', () => {
  it('レスポンスの unlocked_positions / pending_rating をそのまま返す', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          checkin_id: 'chk-1',
          booth: { id: 'booth-1', name: 'ブースA' },
          synced_at: '2026-10-16T04:12:00.000Z',
          cooldown_remaining_sec: 0,
          filled_cell: { position: 6 },
          unlocked_positions: [4, 7],
          unlocked_pairs: [{ pair_key: '5-6', released_positions: [4, 7] }],
          new_lines: 0,
          lines_completed: 0,
          pending_rating: { checkin_id: 'chk-0', booth_id: 'booth-0', booth_name: 'ブース0' },
        },
      },
    })
    const res = await postV1CheckIn('evt-1', { method: 'qr', booth_id: 'booth-1', checked_in_at: '2026-10-16T04:12:00.000Z' })
    expect(res.unlocked_positions).toEqual([4, 7])
    expect(res.unlocked_pairs).toEqual([{ pair_key: '5-6', released_positions: [4, 7] }])
    expect(res.pending_rating?.checkin_id).toBe('chk-0')
    // unlocked（真偽値）/ coins_earned はもう来ない
    expect(res).not.toHaveProperty('unlocked')
    expect(res).not.toHaveProperty('coins_earned')
  })
})

describe('postV1CheckIn（複数ペア同時解放）', () => {
  it('中央3マス目の達成では unlocked_pairs が2件返り、unlocked_positions は平坦に混ざる', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          checkin_id: 'chk-2',
          booth: { id: 'booth-2', name: 'ブースB' },
          synced_at: '2026-10-16T04:20:00.000Z',
          cooldown_remaining_sec: 0,
          filled_cell: { position: 5 },
          unlocked_positions: [1, 13, 3, 12],
          unlocked_pairs: [
            { pair_key: '5-9', released_positions: [1, 13] },
            { pair_key: '6-9', released_positions: [3, 12] },
          ],
          new_lines: 0,
          lines_completed: 0,
          pending_rating: null,
        },
      },
    })
    const res = await postV1CheckIn('evt-1', { method: 'qr', booth_id: 'booth-2', checked_in_at: '2026-10-16T04:20:00.000Z' })
    expect(res.unlocked_pairs).toHaveLength(2)
    expect(res.unlocked_pairs.map((p) => p.pair_key)).toEqual(['5-9', '6-9'])
  })
})

describe('postV1CheckInRating', () => {
  it('既定の context は MANUAL', async () => {
    postMock.mockResolvedValueOnce({ data: { success: true, data: { rating_id: 'r-1' } } })
    await postV1CheckInRating('evt-1', 'chk-1', 3)
    expect(postMock).toHaveBeenCalledWith(
      '/events/evt-1/checkins/chk-1/rating',
      { rating: 3, context: 'MANUAL' },
    )
  })

  it('NEXT_CHECKIN を明示的に渡せる', async () => {
    postMock.mockResolvedValueOnce({ data: { success: true, data: { rating_id: 'r-2' } } })
    await postV1CheckInRating('evt-1', 'chk-2', 4, 'よかった', 'NEXT_CHECKIN')
    expect(postMock).toHaveBeenCalledWith(
      '/events/evt-1/checkins/chk-2/rating',
      { rating: 4, context: 'NEXT_CHECKIN', comment: 'よかった' },
    )
  })
})
