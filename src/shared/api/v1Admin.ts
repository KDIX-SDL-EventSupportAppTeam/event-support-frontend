import { apiClient } from '@/shared/api/client'
import { unwrapApiData } from '@/shared/api/unwrap'
import type { ApiResponse } from '@/shared/types/api'

export type AdminEvent = {
  id: string
  name: string
  date_start: string
  date_end: string
  venue: string | null
  survey_url: string | null
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

export type AdminDashboardBingo = {
  checkins: number
  ratings: number
  /** 0〜1。サーバーが小数3桁に丸めて返す */
  rating_collection_rate: number
  unlocks: { first: number; second: number; third: number }
  /** 0〜1 */
  fallback_rate_last_30min: number
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
  bingo: AdminDashboardBingo
}

export async function fetchAdminEvent(eventId: string): Promise<AdminEvent> {
  const res = await apiClient.get<ApiResponse<{ event: AdminEvent }>>(
    `/admin/events/${encodeURIComponent(eventId)}`,
  )
  return unwrapApiData(res).event
}

export async function updateAdminEvent(
  eventId: string,
  body: Partial<Pick<AdminEvent, 'name' | 'date_start' | 'date_end' | 'venue' | 'survey_url'>>,
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

// ---- 推薦エンジン状態の中継（server: docs/specs/recommender-phase-linkage/01-ops-state-relay.md） ----
export type RecommenderStateReason = 'UNCONFIGURED' | 'UNAUTHORIZED' | 'UNREACHABLE' | 'BAD_RESPONSE'
/** 推薦エンジン /ops/state のうち画面が使うキーだけを型にする（無いキーは書かない。T-10） */
export type RecommenderOpsState = {
  phase?: { current?: string; gate_detail?: { size?: boolean; rules?: boolean; gamma?: boolean; coverage?: boolean } }
  snapshot?: { decision_table_size?: number | null; built_at?: string | null }
  config?: { phase_similarity_min?: number; phase_drsa_min?: number }
}
export type RecommenderState =
  | { available: true; fetched_at: string; state: RecommenderOpsState }
  | { available: false; reason: RecommenderStateReason; fetched_at: string }

export async function fetchRecommenderState(eventId: string): Promise<RecommenderState> {
  const res = await apiClient.get<ApiResponse<RecommenderState>>(
    `/admin/events/${encodeURIComponent(eventId)}/recommender/state`,
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
  comment: string | null
  user_display_name: string
}

// ---- ブース一覧（server #55: GET /admin/events/:event_id/booths） ----
export type AdminBoothSort = 'checkin_count' | 'avg_rating' | 'name'
export type AdminBoothSummary = {
  id: string
  name: string
  checkin_count: number
  avg_rating: number | null
  comment_count: number
}
export async function fetchAdminBoothSummaries(
  eventId: string,
  params: { sort: AdminBoothSort; order: 'asc' | 'desc' },
): Promise<AdminBoothSummary[]> {
  const res = await apiClient.get<ApiResponse<{ booths: AdminBoothSummary[] }>>(
    `/admin/events/${encodeURIComponent(eventId)}/booths`,
    { params },
  )
  return unwrapApiData(res).booths
}

// ---- ブース別コメント（server #54: GET /admin/events/:event_id/booths/:booth_id/comments） ----
export type AdminBoothComment = {
  id: string
  rating: number
  comment: string
  user_display_name: string | null
  rated_at: string // ISO8601（注意: created_at ではない）
  is_hidden: boolean // 今回はUI未使用（表示制御は未実装）
}
export type AdminBoothCommentsPage = {
  booth: { id: string; name: string }
  comments: AdminBoothComment[]
  pagination: { limit: number; offset: number; total: number; has_more: boolean }
}
export async function fetchAdminBoothComments(
  eventId: string,
  boothId: string,
  params: { limit?: number; offset?: number } = {},
): Promise<AdminBoothCommentsPage> {
  const res = await apiClient.get<ApiResponse<AdminBoothCommentsPage>>(
    `/admin/events/${encodeURIComponent(eventId)}/booths/${encodeURIComponent(boothId)}/comments`,
    { params: { limit: params.limit ?? 20, offset: params.offset ?? 0 } },
  )
  return unwrapApiData(res)
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

export type AdminAuditLog = {
  id: string
  actor_id: string
  actor_role: string
  actor_display_name: string | null
  action: string
  target_type: string
  target_id: string | null
  detail: unknown
  created_at: string
}

export type AdminAuditLogPage = {
  audit_logs: AdminAuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export async function fetchAdminAuditLogs(
  eventId: string,
  params: { page?: number; limit?: number } = {},
): Promise<AdminAuditLogPage> {
  const res = await apiClient.get<ApiResponse<AdminAuditLogPage>>(
    `/admin/events/${encodeURIComponent(eventId)}/audit-logs`,
    { params: { page: params.page ?? 1, limit: params.limit ?? 50 } },
  )
  return unwrapApiData(res)
}
// ---- ガチャコイン使用状況（server: docs/specs/gacha-and-award/04-api/organizer-api.md） ----
/**
 * 当日モニタ用のガチャ使用状況。server: docs/specs/gacha-and-award/04-api/organizer-api.md
 * サーバーが返す 4 項目だけを書く（T-9）。獲得総数・is_enabled は Phase B（server 追加後）に足す。
 */
export type AdminGachaStats = {
  /** 使用済みコインの総数（gacha_coin_uses の行数） */
  total_used: number
  /** 換算後 earned > 0 の参加者数（スタッフ・出展者は含まない） */
  users_with_coins: number
  /** 1 枚以上使った参加者の実人数 */
  users_who_used: number
  /** 時間帯別の使用数。hour は ISO 8601（UTC）で 1 時間刻み */
  used_by_hour: { hour: string; count: number }[]
}

export async function fetchAdminGachaStats(eventId: string): Promise<AdminGachaStats> {
  const res = await apiClient.get<ApiResponse<AdminGachaStats>>(
    `/admin/events/${encodeURIComponent(eventId)}/gacha/stats`,
  )
  return unwrapApiData(res)
}

export type ExhibitorBulkAccount = { email: string; password: string; booth_id: string }
export type ExhibitorBulkRowResult = {
  index: number
  email: string
  booth_id: string
  status: 'created' | 'updated' | 'skipped' | 'error'
  user_id?: string
  error?: { code: string; message: string }
}
export type ExhibitorBulkResult = {
  summary: { total: number; created: number; updated: number; skipped: number; failed: number }
  results: ExhibitorBulkRowResult[]
}

export async function bulkRegisterExhibitors(
  eventId: string,
  accounts: ExhibitorBulkAccount[],
): Promise<ExhibitorBulkResult> {
  const res = await apiClient.post<ApiResponse<ExhibitorBulkResult>>(
    `/admin/events/${encodeURIComponent(eventId)}/exhibitors/bulk`,
    { accounts },
  )
  return unwrapApiData(res)
}
