/** `npm run dev` では既定で有効。実 API に繋ぐときは `.env` に `VITE_MOCK_API=false`。本番ビルドでは常に無効 */
export function isMockAuthEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_MOCK_API !== 'false'
}

/** ローカルモックログインで発行する固定トークン（`authStore` のセッション復元と一致させる） */
export const MOCK_DEV_JWT = 'mock.jwt.local-dev'

/** モック認証専用の短い ID（Fastify では不可） */
export const DEV_DUMMY_EVENT_ID = '0000'
