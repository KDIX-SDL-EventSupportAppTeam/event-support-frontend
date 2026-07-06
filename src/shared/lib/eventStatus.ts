/**
 * 開催ステータスの導出ユーティリティ。
 *
 * DB には開催ステータスを持たず、`date_start` / `date_end` と現在時刻から導出する
 * （.sdd 2026-07-05-organizer-portal-phase2 の確定制約）。admin / organizer 両 feature から
 * 共用するため、`AdminEvent` 等の型に依存せず ISO 文字列 2 つを受け取る形に一般化している。
 */

export type EventStatusKey = 'upcoming' | 'ongoing' | 'ended'

export type EventStatus = {
  key: EventStatusKey
  label: string
  className: string
}

const STATUS: Record<EventStatusKey, EventStatus> = {
  upcoming: { key: 'upcoming', label: '準備中', className: 'bg-secondary' },
  ongoing: { key: 'ongoing', label: '開催中', className: 'bg-success' },
  ended: { key: 'ended', label: '終了', className: 'bg-dark' },
}

/** 開催ステータス（準備中 / 開催中 / 終了）を返す。`now` は主にテスト用（既定 `Date.now()`）。 */
export function eventStatus(
  dateStartIso: string,
  dateEndIso: string,
  now: number = Date.now(),
): EventStatus {
  const start = new Date(dateStartIso).getTime()
  const end = new Date(dateEndIso).getTime()
  if (now < start) return STATUS.upcoming
  if (now <= end) return STATUS.ongoing
  return STATUS.ended
}

/**
 * 開始前は「開始まで H時間M分」、開催中は「終了まで H時間M分」、終了後は null を返す。
 */
export function formatRemaining(
  dateStartIso: string,
  dateEndIso: string,
  now: number = Date.now(),
): string | null {
  const start = new Date(dateStartIso).getTime()
  const end = new Date(dateEndIso).getTime()
  if (now < start) return `開始まで ${formatDuration(start - now)}`
  if (now <= end) return `終了まで ${formatDuration(end - now)}`
  return null
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}時間${m}分`
}
