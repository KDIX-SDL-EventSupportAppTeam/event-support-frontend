import { describe, it, expect, vi } from 'vitest'

const getMock = vi.fn()

vi.mock('@/shared/api/publicClient', () => ({
  publicClient: {
    get: (...args: unknown[]) => getMock(...args),
  },
}))

const { fetchAppAccess } = await import('@/shared/api/appAccess')

describe('fetchAppAccess', () => {
  it('/app-access からレスポンスをそのまま取り出す', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          event_id: 'evt-1',
          is_open: false,
          mode: 'scheduled',
          app_opens_at: '2026-10-16T00:30:00.000Z',
          pre_survey_closes_at: '2026-10-15T14:59:59.000Z',
          is_pre_survey_open: true,
          server_time: '2026-10-15T05:00:00.000Z',
        },
      },
    })

    const access = await fetchAppAccess('evt-1')

    expect(getMock).toHaveBeenCalledWith('/events/evt-1/app-access')
    expect(access.is_open).toBe(false)
    expect(access.mode).toBe('scheduled')
    expect(access.server_time).toBe('2026-10-15T05:00:00.000Z')
    // app_closes_at / updated_by は公開エンドポイントから返らない（06-api.md）
    expect(access).not.toHaveProperty('app_closes_at')
    expect(access).not.toHaveProperty('updated_by')
  })

  it('event_id は URL エンコードして渡す', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          event_id: 'evt with space',
          is_open: true,
          mode: 'open',
          app_opens_at: null,
          pre_survey_closes_at: null,
          is_pre_survey_open: true,
          server_time: '2026-10-15T05:00:00.000Z',
        },
      },
    })

    await fetchAppAccess('evt with space')

    expect(getMock).toHaveBeenCalledWith('/events/evt%20with%20space/app-access')
  })
})
