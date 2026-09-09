import { describe, it, expect, vi, beforeEach } from 'vitest'

const getMock = vi.fn()
const postMock = vi.fn()

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: (...a: unknown[]) => getMock(...a),
    post: (...a: unknown[]) => postMock(...a),
  },
}))

const { fetchAwardVoteSnapshot, postAwardVotes } = await import('@/shared/api/v1Awards')

const serverSnapshot = {
  voting_open: true,
  awards: [{ id: 'a1', name: 'ベスト賞', description: 'x', color: 'pink' }],
  checked_booths: [
    { id: 'b1', name: 'ブースA', description: 'desc', display_code: 'A-1', category_id: null },
  ],
  votes: { a1: 'b1' },
}

beforeEach(() => {
  getMock.mockReset()
  postMock.mockReset()
})

describe('fetchAwardVoteSnapshot', () => {
  it('snake_case のサーバー応答を camelCase のスナップショットへ変換する', async () => {
    getMock.mockResolvedValueOnce({ data: { success: true, data: serverSnapshot } })
    const snap = await fetchAwardVoteSnapshot('evt-1')
    expect(getMock).toHaveBeenCalledWith('/events/evt-1/awards/vote')
    expect(snap.votingOpen).toBe(true)
    expect(snap.awards[0].id).toBe('a1')
    // checked_booths は LegacyBooth 形へ（description / image を必ず埋める）
    expect(snap.checkedBooths[0]).toMatchObject({
      booth_id: 'b1',
      booth_name: 'ブースA',
      booth_description: 'desc',
      booth_display_code: 'A-1',
      booth_image_url: null,
    })
    expect(snap.votes).toEqual({ a1: 'b1' })
  })
})

describe('postAwardVotes', () => {
  it('votes をそのまま送り、保存後スナップショットを返す', async () => {
    postMock.mockResolvedValueOnce({ data: { success: true, data: serverSnapshot } })
    const snap = await postAwardVotes('evt-1', { a1: 'b1', a2: null })
    expect(postMock).toHaveBeenCalledWith('/events/evt-1/awards/vote', { votes: { a1: 'b1', a2: null } })
    expect(snap.votes).toEqual({ a1: 'b1' })
  })

  it('409 VOTING_CLOSED を ApiError に変換して投げる', async () => {
    postMock.mockRejectedValueOnce(
      Object.assign(new Error('closed'), {
        isAxiosError: true,
        response: { status: 409, data: { success: false, error: { code: 'VOTING_CLOSED', message: '締切' } } },
      }),
    )
    await expect(postAwardVotes('evt-1', {})).rejects.toMatchObject({ code: 'VOTING_CLOSED' })
  })
})
