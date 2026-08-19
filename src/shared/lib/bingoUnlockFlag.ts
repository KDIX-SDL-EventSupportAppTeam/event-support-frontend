/**
 * 解放演出の再生済みフラグ（`card_id` をキーに `sessionStorage`）。
 * 仕様: docs/.sdd/02-bingo-card/unlock-animation.md
 * 「両方が届いても演出は1回だけ」「リロードしても再生し直さない」を満たすための実装。
 */
const KEY_PREFIX = 'es_bingo_unlock_played_'

export function hasPlayedUnlockAnimation(cardId: string): boolean {
  return sessionStorage.getItem(KEY_PREFIX + cardId) === '1'
}

export function markUnlockAnimationPlayed(cardId: string): void {
  sessionStorage.setItem(KEY_PREFIX + cardId, '1')
}
