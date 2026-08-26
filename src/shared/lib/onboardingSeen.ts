/**
 * オンボーディングの既読管理。
 * 仕様: docs/specs/design-refresh-2026/06-onboarding.md
 *
 * 「この端末でもう見た」という UI 都合の状態のためサーバーには持たず localStorage に置く。
 * 命名・API の作法は `src/shared/lib/bingoCelebration.ts` に倣う。
 */
const SEEN_KEY = 'onboardingSeen'

/** 初回ログイン後、まだこの端末でオンボーディングを見ていなければ自動表示するために使う。 */
export function hasSeenOnboarding(): boolean {
  return localStorage.getItem(SEEN_KEY) === 'true'
}

/** 最後のスライドまで到達した、またはスキップした時点で既読にする。 */
export function markOnboardingSeen(): void {
  localStorage.setItem(SEEN_KEY, 'true')
}
