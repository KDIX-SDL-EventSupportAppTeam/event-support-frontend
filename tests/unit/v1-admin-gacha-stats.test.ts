import { describe, it, expect, vi } from 'vitest'

const getMock = vi.fn()

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
  },
}))

const { fetchAdminGachaStats } = await import('@/shared/api/v1Admin')

describe('fetchAdminGachaStats', () => {
  it('gacha/stats を正しい URL で引き、data をそのまま返す', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          total_used: 128,
          users_with_coins: 64,
          users_who_used: 51,
          used_by_hour: [{ hour: '2026-10-16T04:00:00.000Z', count: 31 }],
        },
      },
    })
    const stats = await fetchAdminGachaStats('evt-1')
    expect(getMock).toHaveBeenCalledWith('/admin/events/evt-1/gacha/stats')
    expect(stats.total_used).toBe(128)
    expect(stats.users_with_coins).toBe(64)
    expect(stats.users_who_used).toBe(51)
    expect(stats.used_by_hour).toHaveLength(1)
    // サーバーが返さないフィールドは型にも結果にも無い（issue #87）
    expect(stats).not.toHaveProperty('is_enabled')
    expect(stats).not.toHaveProperty('total_earned')
  })
})
