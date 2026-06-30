import axios from 'axios'
import { useOrganizerStore } from '@/features/organizer/store/organizerStore'

const ORGANIZER_TOKEN_KEY = 'organizer_auth_token'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export const organizerApiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

organizerApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ORGANIZER_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

organizerApiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    const url: string = error?.config?.url ?? ''
    const isAuthEndpoint = url.includes('/auth/')
    if (status === 401 && !isAuthEndpoint) {
      useOrganizerStore.getState().clear()
      window.location.assign('/organizer/login')
    }
    return Promise.reject(error)
  },
)

// --- 型定義 ---

export type OrganizerLoginBody = {
  email: string
  password: string
}

export type OrganizerLoginResponse = {
  token: string
  organizer: {
    id: string
    email: string
    display_name: string
  }
}

export type CreateEventBody = {
  name: string
  date_start: string
  date_end: string
  venue?: string
  initial_manager: {
    email: string
    password: string
    display_name?: string
  }
}

export type CreatedEvent = {
  id: string
  name: string
  date_start: string
  date_end: string
  venue: string | null
  participant_url: string
  admin_url: string
  initial_manager_email: string
}

export type InviteStaffBody = {
  email: string
  password: string
  display_name?: string
  role: 'manager' | 'viewer'
}

export type InvitedStaff = {
  id: string
  email: string
  display_name: string
  role: 'manager' | 'viewer'
}

// --- API 関数 ---

export async function organizerLogin(body: OrganizerLoginBody): Promise<OrganizerLoginResponse> {
  const res = await organizerApiClient.post<OrganizerLoginResponse>(
    '/organizer/auth/login',
    body,
  )
  return res.data
}

export async function createOrganizerEvent(body: CreateEventBody): Promise<CreatedEvent> {
  const res = await organizerApiClient.post<{ data: CreatedEvent }>(
    '/organizer/events',
    body,
  )
  return res.data.data
}

export async function inviteOrganizerStaff(
  eventId: string,
  body: InviteStaffBody,
): Promise<InvitedStaff> {
  const res = await organizerApiClient.post<{ data: InvitedStaff }>(
    `/organizer/events/${encodeURIComponent(eventId)}/staff`,
    body,
  )
  return res.data.data
}
