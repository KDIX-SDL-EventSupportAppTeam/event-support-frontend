export type GachaFetchState = 'loading' | 'ok' | 'stale' | 'error'

/** 取得状態の判定。「取れていない」と「0」を混同させないための唯一の分岐点 */
export function resolveGachaFetchState(input: { hasStats: boolean; error: string | null }): GachaFetchState {
  if (input.error === null) return input.hasStats ? 'ok' : 'loading'
  return input.hasStats ? 'stale' : 'error'
}

/** ISO(UTC) の 1 時間刻みを端末ローカル（当日は JST）の「HH:00」に */
export function formatHourLabel(isoHour: string): string {
  const d = new Date(isoHour)
  if (Number.isNaN(d.getTime())) return isoHour
  return `${String(d.getHours()).padStart(2, '0')}:00`
}

export function formatFetchedAt(d: Date): string {
  return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
