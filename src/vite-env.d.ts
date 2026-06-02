/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** ローカル専用: ログイン画面のイベント ID 初期値 */
  readonly VITE_DEV_EVENT_ID?: string
  readonly VITE_DEV_LOGIN_EMAIL?: string
  readonly VITE_DEV_LOGIN_PASSWORD?: string
  /** `false` のときだけ実 API。未設定時は開発サーバーではモック認証 */
  readonly VITE_MOCK_API?: string
  /** `sample` | `api`。未設定時は dev→sample、production→api */
  readonly VITE_DATA_SOURCE?: string
  /** 旧 Flask 用。未設定時は相対パス（Vite プロキシ `/api` → :5000） */
  readonly VITE_LEGACY_API_BASE_URL?: string
  /** ホーム「アプリフィードバック」で開くフォーム URL（未設定時は開発用の既定 URL） */
  readonly VITE_FEEDBACK_FORM_URL?: string
  /** CD 動作確認用（本番ビルド時のみ index.html コメントに埋め込む） */
  readonly VITE_CD_TEST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
