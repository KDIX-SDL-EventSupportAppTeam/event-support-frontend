import { apiClient } from '@/api/client'
import { unwrapApiData } from '@/api/unwrap'
import { isMockAuthEnabled, mockLogin, mockRegister } from '@/mocks/authMock'
import type { LoginResult } from '@/types/auth'

export type { LoginResult } from '@/types/auth'

export async function login(
  eventId: string,
  email: string,
  password: string,
): Promise<LoginResult> {
  if (isMockAuthEnabled()) {
    return mockLogin(eventId, email, password)
  }
  return unwrapApiData(
    await apiClient.post('/auth/login', {
      event_id: eventId,
      email,
      password,
    }),
  )
}

export async function register(
  eventId: string,
  email: string,
  password: string,
  displayName: string,
): Promise<LoginResult> {
  if (isMockAuthEnabled()) {
    return mockRegister(eventId, email, password, displayName)
  }
  return unwrapApiData(
    await apiClient.post('/auth/register', {
      event_id: eventId,
      email,
      password,
      display_name: displayName,
    }),
  )
}
