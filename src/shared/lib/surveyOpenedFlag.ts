/**
 * 「イベントアンケートをこの端末で開いた」の記録（issue #151）。
 *
 * **これは「回答済み」ではない。** イベントアンケートは外部フォームで、
 * 回答したかどうかを知る API は無い。したがって**回答済みを localStorage で捏造しない。**
 * 記録するのは「開いた」という端末側の事実だけで、表示も「開きました」に留める。
 *
 * 「この端末でもう開いた」という UI 都合の状態なのでサーバーには持たない。
 * 命名・API の作法は `src/shared/lib/coinCelebration.ts` に倣う。
 * イベント・ユーザー単位（共有端末で他人の状態を出さない）。
 */
const openedKey = (eventId: string, userId: string) => `surveyOpened_${eventId}_${userId}`

/** この端末でイベントアンケートを開いていれば true。 */
export function hasOpenedSurvey(eventId: string, userId: string): boolean {
  return localStorage.getItem(openedKey(eventId, userId)) === 'true'
}

/** 外部タブで開いた時点で記録する。 */
export function markSurveyOpened(eventId: string, userId: string): void {
  localStorage.setItem(openedKey(eventId, userId), 'true')
}
