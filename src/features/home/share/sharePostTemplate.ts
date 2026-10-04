/**
 * X（旧 Twitter）へのポスト文面のテンプレート。
 *
 * **投稿フォーマットの変更は、このファイルだけの修正で完結すること。**
 * - 文面組み立ては副作用を持たない純関数にする（DOM 操作・URL 組み立て・API 呼び出しをしない）
 * - X の Intent URL 化は `@/shared/lib/xShare` の責務。ここは文面の内容だけを持つ
 *
 * issue #63
 */

/**
 * ハッシュタグ（`#` なし。本文へ入れるときに付ける）。フォーマット変更はここを直す。
 * X の Intent の `hashtags` パラメータはネイティブアプリに無視されるため、本文に含めて渡す（issue #169）。
 */
const HASHTAGS = ['PRoToFES'] as const

export type SharePostParams = {
  /** イベント名（`fetchPublicEvent` の `name`）。空のときは既定語にフォールバックする */
  eventName?: string
  /** 併記する URL（未設定なら付けない）。環境で変えたい場合は呼び出し側で `VITE_X_SHARE_URL` を渡す */
  shareUrl?: string
}

export type SharePost = {
  /** URL を除く本文。ハッシュタグを含む */
  text: string
  url?: string
}

/**
 * パラメータからポスト内容を組み立てる純関数。
 * `text` にハッシュタグを含める（`xShare` は `hashtags` パラメータを持たない）。URL は含めない（`url` パラメータで渡す）。
 */
export function buildSharePost({ eventName, shareUrl }: SharePostParams = {}): SharePost {
  const name = eventName?.trim() || 'イベント'
  const url = shareUrl?.trim() || undefined
  const tags = HASHTAGS.map((t) => `#${t}`).join(' ')
  return {
    text: `${name}に参加中！ ブースをまわってビンゴを埋めよう🎯\n${tags}`,
    url,
  }
}
