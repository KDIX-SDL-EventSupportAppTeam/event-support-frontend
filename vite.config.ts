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
        // Bootstrap 5 の SCSS 自体が Dart Sass 3.0 系の非推奨機能（@import・
        // グローバル mix() など）を使っており、ビルドのたびに大量の警告を出す。
        // quietDeps は node_modules 配下（依存先）由来の警告だけを黙らせるため、
        // src/ 配下で新たに非推奨記法を書けば警告は従来どおり出る。
        quietDeps: true,
        // src/shared/styles/legacy-app.scss の `@import 'bootstrap/scss/bootstrap'`
        // は自ファイル内で起きる警告なので quietDeps では消えない。Bootstrap 5 は
        // @use 経由の変数上書きに対応しておらず @import を使わざるを得ないため、
        // import 系の非推奨警告だけを抑止する。
        // 注意: これはビルド全体に効くので、src/ 配下で新しく @import を書いても
        // 警告が出なくなる。新規SCSSでは @use / @forward を使うこと。
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
      // `/checkin` のプロキシを足さないこと。SPA ルートの /checkin と完全一致し、
      // 直接アクセス・リロード時に開発サーバーが 500 を返す（旧 Vue 版の名残で実在した）。
    },
  },
})
