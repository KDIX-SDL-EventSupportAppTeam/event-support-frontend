import { LAST_EVENT_ID_KEY } from '@/shared/config/storageKeys'

/**
 * 控えの有効期間。これを過ぎた控えは「無い」ものとして扱う。
 *
 * 7 日にした根拠: イベントは単日開催で、前後の準備・振り返りを含めても 1 週間あれば足りる。
 * 控えに期限が無いと、去年のイベントの ID が残り続け、セッション切れのたびに
 * 終了済み・削除済みのイベントへ送り返される（issue #173 経路B）。
 * TTL を入れても、7 日以内に終了したイベントへは送られる。完全な解決ではなく、
 * 本命は入口の脱出導線（`EntryEscapeActions`）。TTL は補助。
 */
export const LAST_EVENT_TTL_MS = 7 * 24 * 60 * 60 * 1000

type StoredLastEvent = { eventId: string; savedAt: number }

/**
 * 直近に踏んだ配布リンクの eventId。
 *
 * 参加者の入口は `/e/:eventId` 1 本だけで、セッション切れでアプリ本体の URL を
 * 直接開かれると「どのイベントへ戻せばよいか」が分からない。JWT が無い状態でも
 * 戻り先を決められるよう、URL 側の情報を端末に控える。
 * 表示上の利便のための値なので、失敗しても機能を止めない。
 * 踏むたびに保存し直すため、有効期間は「最後に踏んだ時刻」から数える。
 */
export function rememberEventId(eventId: string, now: number = Date.now()): void {
  if (!eventId) return
  try {
    const value: StoredLastEvent = { eventId, savedAt: now }
    localStorage.setItem(LAST_EVENT_ID_KEY, JSON.stringify(value))
  } catch {
    /* プライベートブラウジング等で書けなくても続行する */
  }
}

/** 控えを消す（別イベントへ移る・ログアウトしてやり直す）。 */
export function clearLastEventId(): void {
  try {
    localStorage.removeItem(LAST_EVENT_ID_KEY)
  } catch {
    /* 失敗しても続行する */
  }
}

/**
 * 有効な控えを返す。期限切れ・破損（旧形式の素の文字列を含む）は `null` を返し、キーも削除する。
 */
export function readLastEventId(now: number = Date.now()): string | null {
  try {
    const raw = localStorage.getItem(LAST_EVENT_ID_KEY)
    if (raw === null) return null
    const parsed = JSON.parse(raw) as Partial<StoredLastEvent> | null
    if (
      parsed &&
      typeof parsed.eventId === 'string' &&
      parsed.eventId &&
      typeof parsed.savedAt === 'number' &&
      now - parsed.savedAt <= LAST_EVENT_TTL_MS
    ) {
      return parsed.eventId
    }
    clearLastEventId()
    return null
  } catch {
    // JSON として読めない（旧形式の素の文字列など）。壊れた控えは捨てる
    clearLastEventId()
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
