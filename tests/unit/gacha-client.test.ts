import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const getMock = vi.fn()
const postMock = vi.fn()

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
  },
}))

const { createGachaClient, GACHA_DISABLED, NO_COINS_AVAILABLE } = await import(
  '@/features/gachapon/api/gachaClient'
)

// jsdom を使わない構成のため、sessionStorage の最小実装を用意する
// （サンプル経路が sampleSession 経由で参照する）
class MemoryStorage {
  private map = new Map<string, string>()
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null
  }
  setItem(k: string, v: string) {
    this.map.set(k, v)
  }
  removeItem(k: string) {
    this.map.delete(k)
  }
  clear() {
    this.map.clear()
  }
}

const COINS = {
  is_enabled: true,
  lines_completed: 3,
  earned: 3,
  used: 1,
  available: 2,
  max_coins: 4,
}

beforeEach(() => {
  getMock.mockReset()
  postMock.mockReset()
  ;(globalThis as { sessionStorage?: unknown }).sessionStorage = new MemoryStorage()
  // 実 API 経路を明示（既定は開発時 sample のため）
  vi.stubEnv('VITE_DATA_SOURCE', 'api')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('gachaClient（実 API 経路）', () => {
  it('getCoins は /gacha/coins を GET して封筒を剥がす', async () => {
    getMock.mockResolvedValueOnce({ data: { success: true, data: COINS } })
    const coins = await createGachaClient().getCoins('evt-1', 'user-1')
    expect(getMock).toHaveBeenCalledWith('/events/evt-1/gacha/coins')
    expect(coins).toEqual(COINS)
  })

  it('useCoin は /gacha/coins/use に渡された冪等キーをそのまま送る（サーバー生成しない。G-5）', async () => {
    postMock.mockResolvedValueOnce({
      data: { success: true, data: { ...COINS, used: 2, available: 1, coin_index: 1, used_at: '2026-10-16T04:12:33.000Z' } },
    })
    const key = '0f4f2b3e-1111-4111-8111-111111111111'
    const result = await createGachaClient().useCoin('evt-1', 'user-1', key)

    expect(postMock).toHaveBeenCalledWith('/events/evt-1/gacha/coins/use', {
      idempotency_key: key,
    })
    expect(result.coin_index).toBe(1)
    expect(result.used_at).toBe('2026-10-16T04:12:33.000Z')
  })

  it('同じ冪等キーで再試行しても、送る値は書き換わらない（リトライで使い回せる）', async () => {
    const key = '0f4f2b3e-2222-4222-8222-222222222222'
    const client = createGachaClient()
    postMock.mockRejectedValueOnce(new Error('network'))
    await expect(client.useCoin('evt-1', 'user-1', key)).rejects.toThrow()
    postMock.mockResolvedValueOnce({
      data: { success: true, data: { ...COINS, coin_index: 0, used_at: '2026-10-16T04:00:00.000Z' } },
    })
    await client.useCoin('evt-1', 'user-1', key)

    expect(postMock.mock.calls).toHaveLength(2)
    expect(postMock.mock.calls[0][1]).toEqual({ idempotency_key: key })
    expect(postMock.mock.calls[1][1]).toEqual({ idempotency_key: key })
  })

  it('エラーコード定数がサーバーの participant-api.md と一致する', () => {
    expect(GACHA_DISABLED).toBe('GACHA_DISABLED')
    expect(NO_COINS_AVAILABLE).toBe('NO_COINS_AVAILABLE')
  })

  it('URL のイベント ID はエンコードされる', async () => {
    getMock.mockResolvedValueOnce({ data: { success: true, data: COINS } })
    await createGachaClient().getCoins('evt/1', 'user-1')
    expect(getMock).toHaveBeenCalledWith('/events/evt%2F1/gacha/coins')
  })
})

describe('gachaClient（サンプル経路）', () => {
  it('sample モードでは API を呼ばない', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'sample')
    const coins = await createGachaClient().getCoins('evt-1', 'user-1')
    expect(getMock).not.toHaveBeenCalled()
    expect(coins.is_enabled).toBe(true)
    expect(coins.max_coins).toBe(4)
    expect(coins.available).toBe(Math.max(0, coins.earned - coins.used))
  })
})
