import { describe, it, expect, vi, beforeEach } from 'vitest'

const postMock = vi.fn()
const mockEnabled = vi.fn(() => false)

vi.mock('@/shared/api/client', () => ({
  apiClient: { post: (...a: unknown[]) => postMock(...a) },
}))
vi.mock('@/features/auth/mocks/authMock', () => ({
  isMockAuthEnabled: () => mockEnabled(),
}))

const { requestPasswordReset, resetPassword } = await import('@/features/auth/api/passwordReset')
const { ApiError } = await import('@/shared/api/unwrap')

beforeEach(() => {
  postMock.mockReset()
  mockEnabled.mockReturnValue(false)
})

describe('requestPasswordReset', () => {
  it('event_id と email を forgot-password に送る', async () => {
    postMock.mockResolvedValueOnce({ data: { success: true, data: { message: 'ok' } } })
    await requestPasswordReset('evt-1', 'a@example.com')
    expect(postMock).toHaveBeenCalledWith('/auth/forgot-password', {
      event_id: 'evt-1',
      email: 'a@example.com',
    })
  })
})

describe('resetPassword', () => {
  it('token と password を reset-password に送る', async () => {
    postMock.mockResolvedValueOnce({ data: { success: true, data: { reset: true } } })
    const res = await resetPassword('a'.repeat(64), 'newpass12')
    expect(postMock).toHaveBeenCalledWith('/auth/reset-password', {
      token: 'a'.repeat(64),
      password: 'newpass12',
    })
    expect(res.reset).toBe(true)
  })

  it('モードがモックのとき token="expired" で TOKEN_EXPIRED', async () => {
    mockEnabled.mockReturnValue(true)
    await expect(resetPassword('expired', 'newpass12')).rejects.toBeInstanceOf(ApiError)
    expect(postMock).not.toHaveBeenCalled()
  })
})
