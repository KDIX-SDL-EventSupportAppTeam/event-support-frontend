/**
 * 「全ガチャコイン獲得」ポップアップの既読管理。
 * 仕様: docs/specs/design-refresh-2026/05-modals.md
 *
 * 05-modals.md では素材（feedback/popup-coin-complete.png）を据え置きにしていたが、
 * その理由は「ガチャが準備中で、全コイン獲得に対応する状態がフロントに無い」ことだった。
 * ガチャ実装により GET /gacha/coins が earned / max_coins を返すようになり、
 * 上限到達が検出できる状態になったため適用する。
 *
 * 「この端末でもう見た」という UI 都合の状態のためサーバーには持たず localStorage に置く。
 * 命名・API の作法は `src/shared/lib/onboardingSeen.ts` に倣う。
 * 達成はイベント・ユーザー単位のため、キーに両方を含める（共有端末で他人の達成を出さない）。
 */
const seenKey = (eventId: string, userId: string) => `coinCompleteSeen_${eventId}_${userId}`

/** この端末でまだ「全コイン獲得」を見ていなければ true。 */
export function hasSeenCoinComplete(eventId: string, userId: string): boolean {
  return localStorage.getItem(seenKey(eventId, userId)) === 'true'
}

/** ポップアップを開いた時点で既読にする（毎回のホーム表示で出さない）。 */
export function markCoinCompleteSeen(eventId: string, userId: string): void {
  localStorage.setItem(seenKey(eventId, userId), 'true')
}
