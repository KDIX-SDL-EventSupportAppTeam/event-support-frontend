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

/** 監査ログ 1 件（誰がいつ何をしたか） */
export type AdminAuditLog = {
  id: string
  event_id: string
  actor_id: string
  actor_role: string
  actor_display_name: string | null
  actor_email: string | null
  action: string
  target_type: string
  target_id: string | null
  detail: unknown
  created_at: string
}

export type AdminAuditLogPage = {
  audit_logs: AdminAuditLog[]
  pagination: { page: number; limit: number; total: number; total_pages: number }
}

export async function fetchAdminAuditLogs(
  eventId: string,
  page = 1,
  limit = 50,
): Promise<AdminAuditLogPage> {
  const res = await apiClient.get<ApiResponse<AdminAuditLogPage>>(
    `/admin/events/${encodeURIComponent(eventId)}/audit-logs?page=${page}&limit=${limit}`,
  )
  return unwrapApiData(res)
}

export type CheckinNewEvent = {
  booth_id: string
  booth_name: string
  user_display_name: string
  checked_in_at: string
}

export type RatingNewEvent = {
  booth_id: string
  booth_name: string
  rating: number
  user_display_name: string
}

export type BoothAnalytics = {
  booths: {
    id: string
    name: string
    manual_code: string
    created_at: string
    category: { id: string; name: string } | null
    tags: string[]
    checkin_count: number
    checkin_by_method: { qr: number; manual: number }
    avg_rating: number | null
    rating_distribution: Record<number, number>
    recommendation_offered_count: number
    recommendation_selected_count: number
    recommendation_acceptance_rate: number | null
  }[]
  category_summary: {
    category_id: string | null
    category_name: string
    total_checkins: number
    avg_rating: number | null
    booth_count: number
  }[]
}

export type ParticipantAnalytics = {
  summary: {
    total: number
    checked_in: number
    not_checked_in: number
    rolling_30min: number
    rolling_10min: number
    rolling_30min_prev: number
  }
  joining_timeline: { time_slot: string; new_participants: number; cumulative: number }[]
  checkin_distribution: { checkin_count: number; num_users: number }[]
  participants: {
    id: string
    display_name: string
    email: string
    role: string
    registered_at: string
    first_checkin_at: string | null
    total_checkins: number
    visited_booths: { id: string; name: string }[]
  }[]
  survey_distribution: {
    age_range: Record<string, number>
    occupation: Record<string, number>
    industry: Record<string, number>
  } | null
}

export type CheckinAnalytics = {
  timeline: { time_slot: string; count: number; cumulative: number }[]
  by_method: { qr: number; manual: number }
  peak_slot: string | null
  peak_count: number
  total: number
  recent: {
    id: string
    booth_name: string
    user_display_name: string
    method: string
    checked_in_at: string
  }[]
}

export type RecommendationAnalytics = {
  summary: {
    total_recommendations: number
    selected_count: number
    acceptance_rate: number
    open_count: number
    algorithm: string
  }
  by_booth: {
    booth_id: string
    booth_name: string
    offered_count: number
    selected_count: number
    acceptance_rate: number | null
  }[]
  transitions: {
    from_booth_id: string
    from_booth_name: string
    to_booth_id: string
    to_booth_name: string
    count: number
  }[]
  conversion: {
    selected_then_checkedin: number
    selected_total: number
    conversion_rate: number | null
    avg_minutes_to_checkin: number | null
  }
}

export async function fetchBoothAnalytics(eventId: string): Promise<BoothAnalytics> {
  const res = await apiClient.get<ApiResponse<BoothAnalytics>>(
    `/admin/events/${encodeURIComponent(eventId)}/analytics/booths`,
  )
  return unwrapApiData(res)
}

export async function fetchParticipantAnalytics(eventId: string): Promise<ParticipantAnalytics> {
  const res = await apiClient.get<ApiResponse<ParticipantAnalytics>>(
    `/admin/events/${encodeURIComponent(eventId)}/analytics/participants`,
  )
  return unwrapApiData(res)
}

export async function fetchCheckinAnalytics(eventId: string): Promise<CheckinAnalytics> {
  const res = await apiClient.get<ApiResponse<CheckinAnalytics>>(
    `/admin/events/${encodeURIComponent(eventId)}/analytics/checkins`,
  )
  return unwrapApiData(res)
}

export async function fetchRecommendationAnalytics(eventId: string): Promise<RecommendationAnalytics> {
  const res = await apiClient.get<ApiResponse<RecommendationAnalytics>>(
    `/admin/events/${encodeURIComponent(eventId)}/analytics/recommendations`,
  )
  return unwrapApiData(res)
}

export type SampleDataGenerateResult = {
  categories: number
  booths: number
  participants: number
  checkins: number
  ratings: number
  recommendations: number
  survey_answers: number
  survey_questions: number
}

export type SampleDataClearResult = {
  users: number
  booths: number
  categories: number
  survey_questions: number
}

export async function generateAdminSampleData(
  eventId: string,
  options: { force?: boolean } = {},
): Promise<SampleDataGenerateResult> {
  const res = await apiClient.post<ApiResponse<{ generated: SampleDataGenerateResult }>>(
    `/admin/events/${encodeURIComponent(eventId)}/sample-data/generate`,
    options,
  )
  return unwrapApiData(res).generated
}

export async function clearAdminSampleData(eventId: string): Promise<SampleDataClearResult> {
  const res = await apiClient.delete<ApiResponse<{ cleared: SampleDataClearResult }>>(
    `/admin/events/${encodeURIComponent(eventId)}/sample-data`,
  )
  return unwrapApiData(res).cleared
}
