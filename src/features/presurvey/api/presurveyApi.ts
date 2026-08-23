import { PRE_SURVEY_QUESTIONS } from '@/features/presurvey/config/questions'
import {
  loadPreSurveyStore,
  savePreSurveyParticipant,
  savePreSurveySubmission,
} from '@/features/presurvey/api/presurveyLocalStore'
import type {
  PreSurveyAnswers,
  PreSurveyParticipant,
  PreSurveyQuestion,
  PreSurveySubmission,
} from '@/features/presurvey/types/presurvey'

/**
 * 事前アンケートのデータアクセス層。
 *
 * 画面はこのモジュールの関数だけを呼ぶ。現状は localStorage 上のモック実装で、
 * サーバー・DB がつながったら **この 4 関数の中身だけ** を差し替える
 * （引数・戻り値の形はサーバー API の想定に合わせてある）。
 *
 * 想定エンドポイント:
 *   GET  /pre-survey/:eventId/questions
 *   POST /pre-survey/:eventId/signup   { email, password, display_name }
 *   POST /pre-survey/:eventId/signin   { email, password }
 *   POST /pre-survey/:eventId/answers  PreSurveySubmission
 */

/** 質問定義の取得。サーバー配信に切り替える場合はここを API 呼び出しにする */
export async function fetchPreSurveyQuestions(_eventId: string): Promise<PreSurveyQuestion[]> {
  void _eventId
  return PRE_SURVEY_QUESTIONS
}

/** 初回サインアップ。既に同じメールが登録済みならその回答者を返す（画面遷移を止めない） */
export async function signUpPreSurvey(params: {
  eventId: string
  email: string
  password: string
  displayName: string
}): Promise<PreSurveyParticipant> {
  const { eventId, email, displayName } = params
  const store = loadPreSurveyStore()
  const key = participantKey(eventId, email)
  const existing = store.participants[key]
  if (existing) return existing

  const participant: PreSurveyParticipant = {
    participant_ref: key,
    event_id: eventId,
    email,
    display_name: displayName,
    has_answered: false,
  }
  savePreSurveyParticipant(participant)
  return participant
}

/** 2 回目以降のサインイン。未登録なら null（呼び出し側でサインアップへ誘導する） */
export async function signInPreSurvey(params: {
  eventId: string
  email: string
  password: string
}): Promise<PreSurveyParticipant | null> {
  const { eventId, email } = params
  const store = loadPreSurveyStore()
  return store.participants[participantKey(eventId, email)] ?? null
}

/** 回答送信。送信後は回答済みフラグを立てて完了画面へ進める */
export async function submitPreSurveyAnswers(params: {
  eventId: string
  participantRef: string
  answers: PreSurveyAnswers
}): Promise<PreSurveySubmission> {
  const submission: PreSurveySubmission = {
    event_id: params.eventId,
    participant_ref: params.participantRef,
    answers: params.answers,
    answered_at: new Date().toISOString(),
  }
  savePreSurveySubmission(submission)
  return submission
}

/** localStorage 上の回答者キー。サーバー接続後は API が返す participant id に置き換わる */
function participantKey(eventId: string, email: string): string {
  return `${eventId}:${email.trim().toLowerCase()}`
}
