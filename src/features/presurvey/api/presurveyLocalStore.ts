import type { PreSurveyParticipant, PreSurveySubmission } from '@/features/presurvey/types/presurvey'

/**
 * 事前アンケートのモック永続化（localStorage）。
 *
 * サーバー・DB 接続前に「初回サインアップ / 2 回目以降サインイン / 回答済み判定」の
 * 画面遷移を確認するためだけの層。**サーバー接続時にこのファイルは削除できる**。
 * 画面から直接触らせず、必ず presurveyApi.ts 経由で使う。
 */

const STORE_KEY = 'pre_survey_mock_store'

type PreSurveyMockStore = {
  /** `${eventId}:${email}` → 回答者 */
  participants: Record<string, PreSurveyParticipant>
  /** participant_ref → 直近の回答 */
  submissions: Record<string, PreSurveySubmission>
}

const EMPTY_STORE: PreSurveyMockStore = { participants: {}, submissions: {} }

export function loadPreSurveyStore(): PreSurveyMockStore {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return EMPTY_STORE
    const parsed = JSON.parse(raw) as Partial<PreSurveyMockStore>
    return {
      participants: parsed.participants ?? {},
      submissions: parsed.submissions ?? {},
    }
  } catch {
    return EMPTY_STORE
  }
}

export function savePreSurveyParticipant(participant: PreSurveyParticipant): void {
  const store = loadPreSurveyStore()
  store.participants[participant.participant_ref] = participant
  writeStore(store)
}

export function savePreSurveySubmission(submission: PreSurveySubmission): void {
  const store = loadPreSurveyStore()
  store.submissions[submission.participant_ref] = submission
  const participant = store.participants[submission.participant_ref]
  if (participant) {
    store.participants[submission.participant_ref] = { ...participant, has_answered: true }
  }
  writeStore(store)
}

function writeStore(store: PreSurveyMockStore): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
  } catch {
    /* ignore（プライベートモード等。画面遷移は止めない） */
  }
}
