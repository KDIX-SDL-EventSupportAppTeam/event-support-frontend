/** サンプルモード用のブラウザセッション（タブ単位）。本番 API とは無関係。 */

const checkedKey = (userId: string) => `es_sample_checked_${userId}`
const gachaExtraKey = (userId: string) => `es_sample_gacha_extra_${userId}`
const cooldownUntilKey = (userId: string) => `es_sample_cooldown_until_${userId}`
const votesKey = (userId: string) => `es_sample_votes_${userId}`

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function readSampleExtraCheckedIds(userId: string): string[] {
  return safeParseJson<string[]>(sessionStorage.getItem(checkedKey(userId)), [])
}

export function appendSampleCheckedId(userId: string, boothId: string): void {
  const cur = new Set(readSampleExtraCheckedIds(userId))
  cur.add(boothId)
  sessionStorage.setItem(checkedKey(userId), JSON.stringify([...cur]))
}

export function readSampleGachaponExtraSpent(userId: string): number {
  const n = Number(sessionStorage.getItem(gachaExtraKey(userId)) ?? '0')
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

export function incrementSampleGachaponExtraSpent(userId: string, maxTotalSpent: number, baseSpent: number): boolean {
  const extra = readSampleGachaponExtraSpent(userId)
  const total = baseSpent + extra
  if (total >= maxTotalSpent) return false
  sessionStorage.setItem(gachaExtraKey(userId), String(extra + 1))
  return true
}

export function readSampleCooldownUntil(userId: string): number {
  return Number(sessionStorage.getItem(cooldownUntilKey(userId)) ?? '0') || 0
}

export function startSampleCooldown(userId: string, durationMs: number): void {
  sessionStorage.setItem(cooldownUntilKey(userId), String(Date.now() + durationMs))
}

export function readSampleVotes(userId: string): Record<string, string | null> {
  return safeParseJson<Record<string, string | null>>(sessionStorage.getItem(votesKey(userId)), {})
}

export function writeSampleVotes(userId: string, votes: Record<string, string | null>): void {
  sessionStorage.setItem(votesKey(userId), JSON.stringify(votes))
}
