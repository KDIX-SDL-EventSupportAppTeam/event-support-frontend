import { create } from 'zustand'
import type { PreSurveyParticipant } from '@/features/presurvey/types/presurvey'

/**
 * 事前アンケートの回答者セッション。
 *
 * アプリ本体の認証（shared/auth/authStore）とは独立。事前アンケートは
 * 本登録前に回答する導線なので、ここでは「誰の回答か」だけを保持する。
 * リロードしても遷移が続くよう sessionStorage にミラーする。
 */

const SESSION_KEY = 'pre_survey_participant'

function readStored(): PreSurveyParticipant | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as PreSurveyParticipant) : null
  } catch {
    return null
  }
}

function writeStored(participant: PreSurveyParticipant | null): void {
  try {
    if (participant) sessionStorage.setItem(SESSION_KEY, JSON.stringify(participant))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

type PreSurveySessionState = {
  participant: PreSurveyParticipant | null
  setParticipant: (participant: PreSurveyParticipant) => void
  markAnswered: () => void
  clear: () => void
}

export const usePreSurveySessionStore = create<PreSurveySessionState>((set, get) => ({
  participant: readStored(),
  setParticipant: (participant) => {
    writeStored(participant)
    set({ participant })
  },
  markAnswered: () => {
    const current = get().participant
    if (!current) return
    const next = { ...current, has_answered: true }
    writeStored(next)
    set({ participant: next })
  },
  clear: () => {
    writeStored(null)
    set({ participant: null })
  },
}))
