/**
 * X（旧 Twitter）の Web Intent URL を組み立て、新規タブで開く。
 *
 * feature 非依存（どの画面からも再利用できる）。
 * **文面の内容は知らない。** 何を書くかは呼び出し側（`features/home/share/sharePostTemplate`）の責務。
 *
 * issue #63
 */

const X_INTENT_ENDPOINT = 'https://twitter.com/intent/tweet'

export type XSharePayload = {
  /** 本文（URL・ハッシュタグは含めない） */
  text: string
  /** ハッシュタグ（`#` 抜き）。空配列・未指定なら付けない */
  hashtags?: string[]
  /** 併記する URL。未指定なら付けない */
  url?: string
}

/** payload から X の Web Intent URL を組み立てる純関数。値は `URLSearchParams` で確実にエンコードする。 */
export function buildXIntentUrl({ text, hashtags, url }: XSharePayload): string {
  const params = new URLSearchParams()
  params.set('text', text)
  const tags = (hashtags ?? []).map((t) => t.trim()).filter(Boolean)
  if (tags.length > 0) params.set('hashtags', tags.join(','))
  if (url && url.trim()) params.set('url', url.trim())
  return `${X_INTENT_ENDPOINT}?${params.toString()}`
}

/** 組み立てた Intent URL を新規タブで開く（既存のフィードバック導線と同じ作法）。 */
export function openXShare(payload: XSharePayload): void {
  window.open(buildXIntentUrl(payload), '_blank', 'noopener,noreferrer')
}
