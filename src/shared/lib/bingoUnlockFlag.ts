/**
 * 解放演出の再生済みフラグ。
 * 仕様: docs/specs/bingo-dynamic-unlock/02-unlock-animation.md
 *
 * 新仕様では解放が最大3回起きるため、単一のブール値では管理できない。
 * `pair_key`（`5-6` など6種類）ごとに独立したフラグを `sessionStorage` に持つ。
 * 「両方の経路（チェックインレスポンス／socket）が届いても演出は1回だけ」
 * 「演出中に画面を離れても、次にカードを開いたときに未再生の演出が出る」を満たすための実装。
 */
const KEY_PREFIX = 'es_bingo_unlock_played_'

function keyFor(cardId: string, pairKey: string): string {
  return `${KEY_PREFIX}${cardId}:${pairKey}`
}

export function hasPlayedUnlockAnimation(cardId: string, pairKey: string): boolean {
  return sessionStorage.getItem(keyFor(cardId, pairKey)) === '1'
}

export function markUnlockAnimationPlayed(cardId: string, pairKey: string): void {
  sessionStorage.setItem(keyFor(cardId, pairKey), '1')
}

/** 与えられた `pair_key` の一覧から、この端末でまだ再生していないものだけを返す。 */
export function filterUnplayed(cardId: string, pairKeys: string[]): string[] {
  return pairKeys.filter((pairKey) => !hasPlayedUnlockAnimation(cardId, pairKey))
}
