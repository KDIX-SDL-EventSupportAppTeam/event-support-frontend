import { LAST_EVENT_ID_KEY } from '@/shared/config/storageKeys'

/**
 * 直近に踏んだ配布リンクの eventId。
 *
 * 参加者の入口は `/e/:eventId` 1 本だけで、セッション切れでアプリ本体の URL を
 * 直接開かれると「どのイベントへ戻せばよいか」が分からない。JWT が無い状態でも
 * 戻り先を決められるよう、URL 側の情報を端末に控える。
 * 表示上の利便のための値なので、失敗しても機能を止めない。
 */
export function rememberEventId(eventId: string): void {
  if (!eventId) return
  try {
    localStorage.setItem(LAST_EVENT_ID_KEY, eventId)
  } catch {
    /* プライベートブラウジング等で書けなくても続行する */
  }
}

export function readLastEventId(): string | null {
  try {
    return localStorage.getItem(LAST_EVENT_ID_KEY)
  } catch {
    return null
  }
}

/**
 * 未認証・未知のルートからの戻り先。
 * 控えがあれば配布リンクへ、無ければ案内ページ（`/e`）へ送る。
 */
export function entryPathForRedirect(): string {
  const eventId = readLastEventId()
  return eventId ? `/e/${eventId}` : '/e'
}
