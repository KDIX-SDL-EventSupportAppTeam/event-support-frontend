import { describe, expect, it } from 'vitest'
import { isAdminUser, isManagerUser } from '@/shared/auth/authStore'
import type { AuthUser } from '@/shared/auth/types'

function makeUser(role: AuthUser['role']): AuthUser {
  return { id: 'u-1', display_name: 'テストユーザー', event_id: 'evt-1', role }
}

describe('isAdminUser / isManagerUser（現行実装の挙動を固定）', () => {
  it.each([
    // [role相当の入力, isAdminUser の期待値, isManagerUser の期待値]
    ['admin', makeUser('admin'), true, true],
    ['manager', makeUser('manager'), true, true],
    ['viewer', makeUser('viewer'), true, false],
    ['participant', makeUser('participant'), false, false],
    ['exhibitor', makeUser('exhibitor'), false, false],
    ['null', null, false, false],
  ] as const)('%s → isAdminUser=%s, isManagerUser=%s', (_label, user, expectedAdmin, expectedManager) => {
    expect(isAdminUser(user)).toBe(expectedAdmin)
    expect(isManagerUser(user)).toBe(expectedManager)
  })
})
