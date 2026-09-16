import { describe, it, expect, vi } from 'vitest'

const getMock = vi.fn()
const patchMock = vi.fn()

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
    patch: (...args: unknown[]) => patchMock(...args),
  },
}))

const { fetchAdminGachaStats, patchAdminGachaEnabled } = await import('@/shared/api/v1Admin')

describe('fetchAdminGachaStats', () => {
  it('gacha/stats を正しい URL で引き、data をそのまま返す', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          is_enabled: true,
          total_used: 128,
          total_earned: 240,
          users_with_coins: 64,
          users_who_used: 51,
          used_by_hour: [{ hour: '2026-10-16T04:00:00.000Z', count: 31 }],
        },
      },
    })
    const stats = await fetchAdminGachaStats('evt-1')
    expect(getMock).toHaveBeenCalledWith('/admin/events/evt-1/gacha/stats')
    expect(stats.is_enabled).toBe(true)
    expect(stats.total_used).toBe(128)
    expect(stats.total_earned).toBe(240)
    expect(stats.users_with_coins).toBe(64)
    expect(stats.users_who_used).toBe(51)
    expect(stats.used_by_hour).toHaveLength(1)
  })
})

describe('patchAdminGachaEnabled', () => {
  it('gacha/enabled に is_enabled を PATCH し、結果を返す', async () => {
    patchMock.mockResolvedValueOnce({ data: { success: true, data: { is_enabled: false } } })
    const res = await patchAdminGachaEnabled('evt-1', false)
    expect(patchMock).toHaveBeenCalledWith('/admin/events/evt-1/gacha/enabled', { is_enabled: false })
    expect(res.is_enabled).toBe(false)
  })
})
