/**
 * 端末・ブラウザの判定（User-Agent の部分一致）。**純関数**で、`navigator.userAgent` は呼び出し側が渡す。
 *
 * UA 判定は当たらないことがある前提で使う。判定できなくても機能は壊さず、
 * 「案内を出さない」「汎用の案内を出す」に倒すこと。
 */

export type InAppBrowser = 'line' | 'gmail' | 'facebook' | 'instagram' | 'other'

/**
 * メールアプリ・SNS アプリ内ブラウザ（WebView）かを判定する。判定できなければ `null`。
 *
 * 初回ログインは認証メールのリンクから入るため、Gmail / Outlook / LINE などの WebView で
 * 開かれていることがある。それらは `getUserMedia` の権限ダイアログを出さない、あるいは API 自体を持たない。
 */
export function detectInAppBrowser(userAgent: string): InAppBrowser | null {
  const ua = userAgent ?? ''
  if (/\bLine\//i.test(ua)) return 'line'
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'facebook'
  if (/Instagram/i.test(ua)) return 'instagram'
  // Gmail アプリ（iOS）は GSA/ ではなく Google Search App の UA を名乗ることがある
  if (/\bGSA\//i.test(ua)) return 'gmail'
  // Android WebView: `; wv)` が付く。Chrome 本体には付かない
  if (/Android/i.test(ua) && /;\s*wv\)/i.test(ua)) return 'other'
  // iOS の WebView は Safari を名乗らない（Version/ も Safari/ も無い AppleWebKit）。
  // CriOS / FxiOS / EdgiOS は iOS 版の Chrome / Firefox / Edge なので除外する
  if (/(iPhone|iPad|iPod)/i.test(ua) && /AppleWebKit/i.test(ua)) {
    if (/(CriOS|FxiOS|EdgiOS|OPiOS)/i.test(ua)) return null
    if (!/Safari\//i.test(ua)) return 'other'
  }
  return null
}

export type Platform = 'ios' | 'android' | 'other'

/** 権限リセット手順を端末別に出し分けるための判定。 */
export function detectPlatform(userAgent: string): Platform {
  const ua = userAgent ?? ''
  if (/(iPhone|iPad|iPod)/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'other'
}
