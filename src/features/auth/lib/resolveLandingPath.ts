/** ログイン後の着地先。出展者だけ出展者ボードへ、それ以外は従来どおりホームへ。 */
export function resolveLandingPath(role: string | undefined): string {
  return role === 'exhibitor' ? '/exhibitor' : '/home'
}
