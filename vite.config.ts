/// <reference types="vite/client" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// 設計ドキュメント: 開発時 API は http://localhost:3000/api/v1 を想定。
// バックエンドが別ポートの場合は .env の VITE_API_BASE_URL でフル URL を指定する。
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      // 旧 Vue 版のチェックイン Webhook 用プロキシだったが、React 側の SPA ルート
      // `/checkin`（参加者のチェックイン画面）とパスが完全一致し、直接アクセスや
      // リロード時に開発サーバーが 500 を返す原因になっていたため削除した。
    },
  },
})
