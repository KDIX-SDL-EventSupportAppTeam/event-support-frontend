import { describe, it, expect } from 'vitest'
import { ApiError } from '@/shared/api/unwrap'
import { mockLogin, MOCK_DEV_JWT } from '@/features/auth/mocks/authMock'
import {
  DEV_DUMMY_EMAIL,
  DEV_DUMMY_EVENT_ID,
  DEV_DUMMY_PASSWORD,
} from '@/features/auth/mocks/devDummyCredentials'

describe('mockLogin', () => {
  it('fixtures のダミーで成功する', async () => {
    const r = await mockLogin(DEV_DUMMY_EVENT_ID, DEV_DUMMY_EMAIL, DEV_DUMMY_PASSWORD)
    expect(r.token).toBe(MOCK_DEV_JWT)
    expect(r.user.display_name).toBe('ローカル（モック）')
    expect(r.user.event_id).toBe(DEV_DUMMY_EVENT_ID)
  })

  it('パスワードが違うと ApiError', async () => {
    await expect(
      mockLogin(DEV_DUMMY_EVENT_ID, DEV_DUMMY_EMAIL, 'wrong'),
    ).rejects.toThrow(ApiError)
  })
})
