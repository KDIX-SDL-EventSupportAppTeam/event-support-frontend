import { describe, it, expect, vi } from 'vitest'

const getMock = vi.fn()
const postMock = vi.fn()

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
  },
}))

const { fetchV1BingoCard, postV1CheckInRating } = await import('@/shared/api/v1Participant')

describe('fetchV1BingoCard', () => {
  it('/bingo/card から BingoCard を取り出す', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          card_id: 'card-1',
          status: 'CENTER_ONLY',
          unlocked_at: null,
          rating_scale: 3,
          progress: { center_filled: 1, center_total: 4, visits_to_unlock: 3 },
          coins: { earned: 0, max: 4 },
          cells: [],
        },
      },
    })
    const card = await fetchV1BingoCard('evt-1')
    expect(getMock).toHaveBeenCalledWith('/events/evt-1/bingo/card')
    expect(card.card_id).toBe('card-1')
    expect(card.status).toBe('CENTER_ONLY')
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
    await postV1CheckInRating('evt-1', 'chk-2', 5, 'よかった', 'NEXT_CHECKIN')
    expect(postMock).toHaveBeenCalledWith(
      '/events/evt-1/checkins/chk-2/rating',
      { rating: 5, context: 'NEXT_CHECKIN', comment: 'よかった' },
    )
  })
})
