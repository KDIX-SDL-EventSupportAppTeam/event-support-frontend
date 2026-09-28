/**
 * メール確認待ち画面（VerifyEmailStep）の自動再確認（D3）を担う購読ロジック。
 * `document` / `window` から分離し、テストでは差し替え可能な最小インターフェースだけに依存する。
 */

export type ListenerTarget = {
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
}

export type VisibilityDocument = ListenerTarget & {
  readonly visibilityState: 'visible' | 'hidden'
}

/** visibilitychange と focus がほぼ同時に来て二重発火するのを防ぐ最小間隔 */
export const RECHECK_DEBOUNCE_MS = 1000

/**
 * タブが表示状態に戻ったとき・ウィンドウにフォーカスが戻ったときに `onRecheck` を呼ぶ。
 * 定期ポーリングはしない。戻り値の関数で購読解除する。
 */
export function attachRecheckListeners(
  doc: VisibilityDocument,
  win: ListenerTarget,
  onRecheck: () => void,
  now: () => number = Date.now,
): () => void {
  let lastCalledAt = 0

  const trigger = () => {
    const at = now()
    if (at - lastCalledAt < RECHECK_DEBOUNCE_MS) return
    lastCalledAt = at
    onRecheck()
  }
  const onVisibilityChange = () => {
    if (doc.visibilityState === 'visible') trigger()
  }

  doc.addEventListener('visibilitychange', onVisibilityChange)
  win.addEventListener('focus', trigger)

  return () => {
    doc.removeEventListener('visibilitychange', onVisibilityChange)
    win.removeEventListener('focus', trigger)
  }
}
