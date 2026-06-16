import { apiClient } from '@/shared/api/client'
import { unwrapApiData } from '@/shared/api/unwrap'
import type { ApiResponse } from '@/shared/types/api'

export type AdminEvent = {
  id: string
  name: string
  date_start: string
  date_end: string
  venue: string | null
  created_at: string
}

export type AdminCategory = { id: string; name: string }

export type AdminBoothInput = {
  name: string
  description?: string
  category_id?: string | null
  manual_code: string
  tags?: string[]
}

export type AdminSurveyQuestion = {
  id: string
  question_text: string
  options: string[]
  display_order: number | null
  is_required: boolean
}

export type AdminParticipant = {
  id: string
  display_name: string
  email: string
  checkin_count: number
  created_at: string
}

export type AdminDashboard = {
  summary: {
    total_participants: number
    total_checkins: number
    avg_checkins_per_user: number
  }
  booths: {
    id: string
    name: string
    checkin_count: number
    avg_rating: number | null
  }[]
  checkin_timeline: { time_slot: string; count: number }[]
}

export async function fetchAdminEvent(eventId: string): Promise<AdminEvent> {
  const res = await apiClient.get<ApiResponse<{ event: AdminEvent }>>(
    `/admin/events/${encodeURIComponent(eventId)}`,
  )
  return unwrapApiData(res).event
}

export async function updateAdminEvent(
  eventId: string,
  body: Partial<Pick<AdminEvent, 'name' | 'date_start' | 'date_end' | 'venue'>>,
): Promise<AdminEvent> {
  const res = await apiClient.patch<ApiResponse<{ event: AdminEvent }>>(
    `/admin/events/${encodeURIComponent(eventId)}`,
    body,
  )
  return unwrapApiData(res).event
}

export async function fetchAdminCategories(eventId: string): Promise<AdminCategory[]> {
  const res = await apiClient.get<ApiResponse<{ categories: AdminCategory[] }>>(
    `/admin/events/${encodeURIComponent(eventId)}/categories`,
  )
  return unwrapApiData(res).categories
}

export async function createAdminCategory(eventId: string, body: { name: string }): Promise<AdminCategory> {
  const res = await apiClient.post<ApiResponse<{ category: AdminCategory }>>(
    `/admin/events/${encodeURIComponent(eventId)}/categories`,
    body,
  )
  return unwrapApiData(res).category
}

export async function updateAdminCategory(
  eventId: string,
  categoryId: string,
  body: { name: string },
): Promise<AdminCategory> {
  const res = await apiClient.patch<ApiResponse<{ category: AdminCategory }>>(
    `/admin/events/${encodeURIComponent(eventId)}/categories/${encodeURIComponent(categoryId)}`,
    body,
  )
  return unwrapApiData(res).category
}

export async function deleteAdminCategory(eventId: string, categoryId: string): Promise<void> {
  await apiClient.delete(`/admin/events/${encodeURIComponent(eventId)}/categories/${encodeURIComponent(categoryId)}`)
}

export async function createAdminBooth(eventId: string, body: AdminBoothInput) {
  const res = await apiClient.post<ApiResponse<{ booth: AdminBoothInput & { id: string } }>>(
    `/admin/events/${encodeURIComponent(eventId)}/booths`,
    body,
  )
  return unwrapApiData(res).booth
}

export async function updateAdminBooth(eventId: string, boothId: string, body: Partial<AdminBoothInput>) {
  const res = await apiClient.patch<ApiResponse<{ booth: AdminBoothInput & { id: string } }>>(
    `/admin/events/${encodeURIComponent(eventId)}/booths/${encodeURIComponent(boothId)}`,
    body,
  )
  return unwrapApiData(res).booth
}

export async function deleteAdminBooth(eventId: string, boothId: string): Promise<void> {
  await apiClient.delete(`/admin/events/${encodeURIComponent(eventId)}/booths/${encodeURIComponent(boothId)}`)
}

export async function fetchAdminSurveyQuestions(eventId: string): Promise<AdminSurveyQuestion[]> {
  const res = await apiClient.get<ApiResponse<{ questions: AdminSurveyQuestion[] }>>(
    `/admin/events/${encodeURIComponent(eventId)}/survey-questions`,
  )
  return unwrapApiData(res).questions
}

export async function createAdminSurveyQuestion(
  eventId: string,
  body: {
    question_text: string
    options: string[]
    display_order?: number | null
    is_required?: boolean
  },
): Promise<AdminSurveyQuestion> {
  const res = await apiClient.post<ApiResponse<{ question: AdminSurveyQuestion }>>(
    `/admin/events/${encodeURIComponent(eventId)}/survey-questions`,
    body,
  )
  return unwrapApiData(res).question
}

export async function updateAdminSurveyQuestion(
  eventId: string,
  questionId: string,
  body: Partial<Omit<AdminSurveyQuestion, 'id'>>,
): Promise<AdminSurveyQuestion> {
  const res = await apiClient.patch<ApiResponse<{ question: AdminSurveyQuestion }>>(
    `/admin/events/${encodeURIComponent(eventId)}/survey-questions/${encodeURIComponent(questionId)}`,
    body,
  )
  return unwrapApiData(res).question
}

export async function deleteAdminSurveyQuestion(eventId: string, questionId: string): Promise<void> {
  await apiClient.delete(
    `/admin/events/${encodeURIComponent(eventId)}/survey-questions/${encodeURIComponent(questionId)}`,
  )
}

export async function fetchAdminParticipants(eventId: string): Promise<AdminParticipant[]> {
  const res = await apiClient.get<ApiResponse<{ participants: AdminParticipant[] }>>(
    `/admin/events/${encodeURIComponent(eventId)}/participants`,
  )
  return unwrapApiData(res).participants
}

export async function deleteAdminParticipant(eventId: string, userId: string): Promise<void> {
  await apiClient.delete(
    `/admin/events/${encodeURIComponent(eventId)}/participants/${encodeURIComponent(userId)}`,
  )
}

export async function fetchAdminDashboard(eventId: string): Promise<AdminDashboard> {
  const res = await apiClient.get<ApiResponse<AdminDashboard>>(
    `/admin/events/${encodeURIComponent(eventId)}/dashboard`,
  )
  return unwrapApiData(res)
}

export type CheckinNewEvent = {
  booth_id: string
  booth_name: string
  user_display_name: string
  checked_in_at: string
}
