import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const publicGet = vi.fn()
const apiGet = vi.fn()
const apiPost = vi.fn()

vi.mock('@/shared/api/publicClient', () => ({
  publicClient: { get: (...a: unknown[]) => publicGet(...a) },
}))
vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: (...a: unknown[]) => apiGet(...a),
    post: (...a: unknown[]) => apiPost(...a),
  },
}))

const { fetchPublicEvent } = await import('@/shared/api/publicEvent')
const { fetchAwardVoteSnapshot, postAwardVotes, invalidateAwardVoteSnapshot } = await import(
  '@/shared/api/v1Awards'
)
const { clearAllCaches } = await import('@/shared/api/responseCache')
const { useAuthStore } = await import('@/shared/auth/authStore')

const publicBody = (name: string) => ({
  data: {
    success: true,
    data: { event: { id: 'e1', name, date_start: '', date_end: '', venue: null, survey_url: null } },
  },
})
const voteBody = (open: boolean, votes: Record<string, string> = {}) => ({
  data: {
    success: true,
    data: { voting_open: open, awards: [], checked_booths: [], votes },
  },
})

beforeEach(() => {
  publicGet.mockReset()
  apiGet.mockReset()
  apiPost.mockReset()
  clearAllCaches()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('fetchPublicEvent のキャッシュ', () => {
  it('3回呼んでも /public は1回、同時呼び出しは Promise を共有する', async () => {
    publicGet.mockResolvedValue(publicBody('イベント'))
    const [a, b] = await Promise.all([fetchPublicEvent('e1'), fetchPublicEvent('e1')])
    const c = await fetchPublicEvent('e1')
    expect(publicGet).toHaveBeenCalledTimes(1)
    expect(a.name).toBe('イベント')
    expect(b).toBe(a)
    expect(c).toBe(a)
  })

  it('eventId が違えば別に取る', async () => {
    publicGet.mockResolvedValue(publicBody('x'))
    await fetchPublicEvent('e1')
    await fetchPublicEvent('e2')
    expect(publicGet).toHaveBeenCalledTimes(2)
  })

  it('失敗はキャッシュしない（次の呼び出しで取り直す）', async () => {
    publicGet.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(publicBody('ok'))
    await expect(fetchPublicEvent('e1')).rejects.toThrow()
    await expect(fetchPublicEvent('e1')).resolves.toMatchObject({ name: 'ok' })
    expect(publicGet).toHaveBeenCalledTimes(2)
  })

  it('トークンが変わる（ログアウト）とキャッシュが消える', async () => {
    publicGet.mockResolvedValue(publicBody('x'))
    useAuthStore.getState().clearSession()
    await fetchPublicEvent('e1')
    useAuthStore.getState().setSession('tok-a', {
      id: 'u1',
      event_id: 'e1',
      display_name: 'a',
      role: 'participant',
    } as never)
    await fetchPublicEvent('e1')
    expect(publicGet).toHaveBeenCalledTimes(2)
    useAuthStore.getState().clearSession()
  })
})

describe('fetchAwardVoteSnapshot のキャッシュ（TTL 60秒）', () => {
  it('60秒以内は /awards/vote を1回しか呼ばない', async () => {
    vi.useFakeTimers()
    apiGet.mockResolvedValue(voteBody(false))
    await fetchAwardVoteSnapshot('e1')
    vi.advanceTimersByTime(59_000)
    await fetchAwardVoteSnapshot('e1')
    await fetchAwardVoteSnapshot('e1')
    expect(apiGet).toHaveBeenCalledTimes(1)
  })

  it('60秒を過ぎると取り直し、voting_open の変化が反映される', async () => {
    vi.useFakeTimers()
    apiGet.mockResolvedValueOnce(voteBody(false)).mockResolvedValueOnce(voteBody(true))
    expect((await fetchAwardVoteSnapshot('e1')).votingOpen).toBe(false)
    vi.advanceTimersByTime(60_001)
    expect((await fetchAwardVoteSnapshot('e1')).votingOpen).toBe(true)
    expect(apiGet).toHaveBeenCalledTimes(2)
  })

  it('投票に成功するとキャッシュを即座に破棄し、次は取り直す', async () => {
    apiGet
      .mockResolvedValueOnce(voteBody(true, {}))
      .mockResolvedValueOnce(voteBody(true, { a1: 'b1' }))
    apiPost.mockResolvedValue(voteBody(true, { a1: 'b1' }))
    await fetchAwardVoteSnapshot('e1')
    await postAwardVotes('e1', { a1: 'b1' })
    const snap = await fetchAwardVoteSnapshot('e1')
    expect(apiGet).toHaveBeenCalledTimes(2)
    expect(snap.votes).toEqual({ a1: 'b1' })
  })

  it('投票に失敗したときはキャッシュを破棄しない', async () => {
    apiGet.mockResolvedValue(voteBody(true))
    apiPost.mockRejectedValue(new Error('boom'))
    await fetchAwardVoteSnapshot('e1')
    await expect(postAwardVotes('e1', {})).rejects.toBeTruthy()
    await fetchAwardVoteSnapshot('e1')
    expect(apiGet).toHaveBeenCalledTimes(1)
  })

  it('invalidateAwardVoteSnapshot（投票画面を開くとき）の後は必ず取り直す', async () => {
    apiGet.mockResolvedValue(voteBody(true))
    await fetchAwardVoteSnapshot('e1')
    invalidateAwardVoteSnapshot('e1')
    await fetchAwardVoteSnapshot('e1')
    expect(apiGet).toHaveBeenCalledTimes(2)
  })

  it('別イベントのキャッシュは共有しない', async () => {
    apiGet.mockResolvedValue(voteBody(true))
    await fetchAwardVoteSnapshot('e1')
    await fetchAwardVoteSnapshot('e2')
    expect(apiGet).toHaveBeenCalledTimes(2)
  })
})
