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
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5 のSCSS自体が @import・color.mix() 未移行などDart Sass 3.0系の
        // 非推奨機能を使っており、大量の警告を出す。node_modules 配下（依存先）由来の
        // 警告を黙らせる。こちら側のSCSS(src/配下)で新たに同種の非推奨記法を使えば
        // 引き続き警告が出る（quietDeps は依存先由来の警告のみを対象にするため）。
        quietDeps: true,
        // legacy-app.scss 自身の `@import 'bootstrap/scss/bootstrap'` だけは
        // このファイル内で発生する警告として quietDeps の対象外になる。
        // Bootstrap 5 は `@use` 経由の変数上書きに対応していないため @import を
        // 使わざるを得ず、この1件だけ個別に黙らせる。
        silenceDeprecations: ['import'],
      },
    },
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
