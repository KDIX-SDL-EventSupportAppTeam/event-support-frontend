/**
 * 解放通知モーダルの秒数と文言。
 * 仕様: docs/specs/bingo-dynamic-unlock/02-unlock-animation.md
 *
 * コンポーネント本体（UnlockAnimation.tsx）から分けているのは、
 * コンポーネント以外の export を混ぜると Fast Refresh が効かなくなるため
 * （eslint react-refresh/only-export-components）。テストからもここを読む。
 */

/** 自動で閉じるまでの時間。読む要素がある静止画なので 2200ms から延ばした（issue #148）。 */
export const UNLOCK_MODAL_AUTO_CLOSE_MS = 3000

/**
 * 「閉じる」が押せるようになるまでの時間。
 * 以前の 1500ms に技術的な理由は無い。読ませる目的は 3 秒の自動クローズで足りる（解放は最大3回起きる）。
 * 0 にしないのは、チェックイン操作のタップがそのまま「閉じる」に当たって通知を見逃すのを防ぐため。
 * 誤タップ防止なら 300ms で十分（issue #193）。
 */
export const UNLOCK_MODAL_BUTTON_ENABLE_MS = 300

/**
 * 差し替え前提の仮置き素材（issue #148: 新規素材の追加は対象外）。
 * 専用の絵が用意できたら**この1箇所だけ**を書き換える。
 */
export const UNLOCK_MODAL_IMAGE = '/bingo/bingo-grid-filled.png'

/** 解放したマス数が伝わる文言。 */
export function unlockModalMessage(count: number): string {
  return `${count}マスのブースが決まりました`
}
