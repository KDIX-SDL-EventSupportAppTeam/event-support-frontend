import { describe, expect, it } from 'vitest'
import { resolveLandingPath } from '@/features/auth/lib/resolveLandingPath'

describe('resolveLandingPath', () => {
  it("'exhibitor' → /exhibitor", () => {
    expect(resolveLandingPath('exhibitor')).toBe('/exhibitor')
  })

  it.each(['participant', 'manager', 'admin', 'viewer'])('%s → /home', (role) => {
    expect(resolveLandingPath(role)).toBe('/home')
  })

  it('undefined → /home', () => {
    expect(resolveLandingPath(undefined)).toBe('/home')
  })
})
