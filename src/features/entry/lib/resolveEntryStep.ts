import type { MeState } from '@/features/entry/api/meState'
import type { AuthUser } from '@/shared/auth/types'

/**
 * 配布リンク（`/e/:eventId`）1 本の中で、いま描くべき段階。
 *
 * URL は段階を持たない。サーバーが返す `MeState` だけが現在地を決めるため、
 * 利用者がどこで中断しても、同じ URL を踏み直せば続きから再開する。
 */
export type EntryStep =
  /** 認証前。サインイン／サインアップ */
  | 'auth'
  /** MeState 取得中 */
  | 'loading'
  /** メール確認待ち */
  | 'verify'
  /** アンケート回答 */
  | 'survey'
  /** 開放待ち（回答完了画面） */
  | 'waiting'
  /** オンボーディング */
  | 'onboarding'
  /** アプリ本体へ抜ける */
  | 'app'

export type ResolveEntryStepParams = {
  hasToken: boolean
  /** JWT の event_id が URL と一致しているか。別イベントのセッションは無いものとして扱う */
  eventMatches: boolean
  role: AuthUser['role'] | undefined
  meState: MeState | null
  /**
   * 公開ゲートの実効状態。`useAppAccess` のポーリング結果で上書きできるよう外から渡す
   * （待機中に再読込なしで開放へ追随させるため）。
   */
  isOpen: boolean
}

/** 参加者以外（出展者・運営）はアンケート導線に乗せず、そのままアプリ本体へ通す。 */
function isParticipant(role: AuthUser['role'] | undefined): boolean {
  return role === undefined || role === 'participant'
}

export function resolveEntryStep({
  hasToken,
  eventMatches,
  role,
  meState,
  isOpen,
}: ResolveEntryStepParams): EntryStep {
  if (!hasToken || !eventMatches) return 'auth'
  if (!isParticipant(role)) return 'app'
  if (!meState) return 'loading'
  if (!meState.email_verified) return 'verify'
  if (!meState.survey_answered) return 'survey'
  if (!isOpen) return 'waiting'
  if (!meState.onboarding_completed) return 'onboarding'
  return 'app'
}
