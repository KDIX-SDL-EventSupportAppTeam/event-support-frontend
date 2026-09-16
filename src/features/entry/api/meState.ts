import { apiClient } from '@/shared/api/client'
import { toApiError, unwrapApiData } from '@/shared/api/unwrap'
import type { ApiResponse } from '@/shared/types/api'
import type { AppAccess } from '@/shared/api/appAccess'

/**
 * 参加者自身の進行状態。配布リンク（`/e/:eventId`）を踏むたびに 1 回だけ呼び、
 * どの段階を描くかを決める（サーバー側 06-api.md / PQ-2 案 B）。
 *
 * 段階ごとに別 API を叩かないのは、往復が増えるうえ判定がクライアント側へ散るため。
 */

export type MeState = {
  email_verified: boolean
  survey_answered: boolean
  /** ISO8601。再回答は上書きされるため「最初に回答した時刻」 */
  survey_answered_at: string | null
  onboarding_completed: boolean
  /** `event_id` は URL から自明なのでサーバーは返さない */
  app_access: Omit<AppAccess, 'event_id'>
}

export async function fetchMeState(eventId: string): Promise<MeState> {
  try {
    return unwrapApiData(
      await apiClient.get<ApiResponse<MeState>>(
        `/events/${encodeURIComponent(eventId)}/me/state`,
      ),
    )
  } catch (e) {
    throw toApiError(e)
  }
}

/**
 * オンボーディング完了の打刻。サーバー側は冪等なので、二重送信を気にしなくてよい。
 * 既読を端末に持たないのは、回答から開放までの数日で端末が変わり得るため。
 */
export async function completeOnboarding(eventId: string): Promise<void> {
  try {
    await apiClient.post(`/events/${encodeURIComponent(eventId)}/me/onboarding`)
  } catch (e) {
    throw toApiError(e)
  }
}
