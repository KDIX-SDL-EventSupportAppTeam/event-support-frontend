/**
 * X（旧 Twitter）の Web Intent URL を組み立て、新規タブで開く。
 *
 * feature 非依存（どの画面からも再利用できる）。
 * **文面の内容は知らない。** 何を書くかは呼び出し側（`features/home/share/sharePostTemplate`）の責務。
 *
 * issue #63
 */

/**
 * 正規の Intent URL。旧 `twitter.com/intent/tweet` は今もリダイレクトで動くが、
 * 余計なリダイレクトを 1 段挟むとネイティブアプリへの引き渡しが不安定になる（issue #169）。
 */
const X_INTENT_ENDPOINT = 'https://x.com/intent/post'

export type XSharePayload = {
  /**
   * 本文。**ハッシュタグもここに含める。**
   *
   * Intent の `hashtags` パラメータは用意しない。ネイティブ X アプリが Universal Link で
   * Intent URL を横取りしたとき、アプリは `text` と `url` しか解釈せず `hashtags` と `via` を捨てる
   * （ブラウザで開いた環境では効くため「消えない環境もある」と観測される）。
   * 「使われないが残っている」状態にすると、次に触る人が再び使ってしまうので、受け口ごと消している。
   */
  text: string
  /** 併記する URL。未指定なら付けない */
  url?: string
}

/** payload から X の Web Intent URL を組み立てる純関数。値は `URLSearchParams` で確実にエンコードする。 */
export function buildXIntentUrl({ text, url }: XSharePayload): string {
  const params = new URLSearchParams()
  params.set('text', text)
  if (url && url.trim()) params.set('url', url.trim())
  return `${X_INTENT_ENDPOINT}?${params.toString()}`
}

/** 組み立てた Intent URL を新規タブで開く（既存のフィードバック導線と同じ作法）。 */
export function openXShare(payload: XSharePayload): void {
  window.open(buildXIntentUrl(payload), '_blank', 'noopener,noreferrer')
}
