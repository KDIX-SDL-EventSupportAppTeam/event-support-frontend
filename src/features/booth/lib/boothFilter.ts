/**
 * ブース一覧の絞り込み（issue #175）。
 *
 * 参加者の当日の関心は「あと何ブース回れば埋まるか」で、訪問済みの一覧ではない。
 * 必要なデータ（ブース一覧とチェックイン済み ID）は既に手元にあるので、サーバーの追加は不要。
 */
export type BoothFilter = 'all' | 'unvisited' | 'visited'

type HasBoothId = { booth_id: string }

/**
 * 絞り込む。`all` のときは元の順序のまま返す（旧「チェックイン済みを優先表示」ソートは廃止した）。
 */
export function filterBooths<T extends HasBoothId>(
  booths: readonly T[],
  checkedInBoothIds: readonly string[],
  filter: BoothFilter,
): T[] {
  if (filter === 'all') return [...booths]
  const checkedIn = new Set(checkedInBoothIds)
  return booths.filter((b) => (filter === 'visited' ? checkedIn.has(b.booth_id) : !checkedIn.has(b.booth_id)))
}

/**
 * 未チェックインのブース数。
 * `booths.length - checkedInBoothIds.length` ではなく、一覧に載っているブースだけを数える。
 * `checkedInBoothIds` に一覧外の ID（削除済み・無効化されたブース）が混ざっても壊れないようにするため。
 */
export function countUnvisited(booths: readonly HasBoothId[], checkedInBoothIds: readonly string[]): number {
  const checkedIn = new Set(checkedInBoothIds)
  return booths.filter((b) => !checkedIn.has(b.booth_id)).length
}

/** 絞り込み結果が 0 件のときの理由。ブース未登録・通信失敗（`no_booths`）と区別する。 */
export type EmptyReason = 'no_booths' | 'all_visited' | 'none_visited' | null

export function emptyReason(
  totalBooths: number,
  shownBooths: number,
  filter: BoothFilter,
): EmptyReason {
  if (shownBooths > 0) return null
  if (totalBooths === 0) return 'no_booths'
  if (filter === 'unvisited') return 'all_visited'
  if (filter === 'visited') return 'none_visited'
  return null
}
