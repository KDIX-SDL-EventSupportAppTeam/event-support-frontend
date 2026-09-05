/**
 * 本番ビルド（`vite build` の mode=production）で許されない環境変数の組み合わせを検出する。
 * vite.config.ts（Node）と tests/（vitest）の両方から呼ぶため、import.meta.env は読まず引数で受ける。
 * 仕様: docs/reference/development.md「本番ビルド・デプロイ」
 */
export type EnvLike = Readonly<Record<string, string | undefined>>

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LOCAL_PREVIEW_RE = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//
const FORBIDDEN_DEV_KEYS = ['VITE_DEV_LOGIN_EMAIL', 'VITE_DEV_LOGIN_PASSWORD', 'VITE_DEV_DISPLAY_NAME'] as const

export function collectProductionEnvErrors(env: EnvLike): string[] {
  const errors: string[] = []
  if (env.VITE_DATA_SOURCE !== 'api') {
    errors.push(`VITE_DATA_SOURCE は 'api' を明示してください（現在: ${env.VITE_DATA_SOURCE ?? '未設定'}）`)
  }
  if (env.VITE_MOCK_API !== 'false') {
    errors.push(`VITE_MOCK_API は 'false' を明示してください（現在: ${env.VITE_MOCK_API ?? '未設定'}）`)
  }
  for (const key of FORBIDDEN_DEV_KEYS) {
    if (env[key]) errors.push(`${key} は本番ビルドで設定してはいけません（値は表示しません）`)
  }
  const eventId = env.VITE_DEV_EVENT_ID?.trim() ?? ''
  if (!UUID_RE.test(eventId)) {
    errors.push('VITE_DEV_EVENT_ID（運営ログインの event_id。本番イベントの UUID）が未設定か UUID 形式ではありません')
  }
  const base = env.VITE_API_BASE_URL ?? ''
  if (!(base.startsWith('https://') || LOCAL_PREVIEW_RE.test(base))) {
    errors.push('VITE_API_BASE_URL は https:// で始まる Cloud Run の URL にしてください（ローカル preview のみ http://127.0.0.1 を許可）')
  }
  return errors
}
