# テスト実行記録 — 2026-09-05（本番ビルドのデータソース誤設定検知）

## 何を

### 対象（src）

- `src/shared/config/productionEnvGuard.ts`（新規。検査の純関数）
- `vite.config.ts`（関数形式に変更し、production モードで検査・throw）
- `index.html`（`<!-- build-env: data-source=%VITE_DATA_SOURCE% mock-api=%VITE_MOCK_API% -->` を追加）
- `src/features/admin/components/AdminSidebar.tsx`（サイドバー最下部に「データ取得元」表示を追加）
- `.github/workflows/ci.yml`（Build ステップに本番相当の `env:` を追加）
- `.env.example` / `src/vite-env.d.ts`（`VITE_DEV_EVENT_ID` のコメントを実態に合わせて修正）
- `docs/reference/development.md`（「本番ビルド・デプロイ」節を本番必須環境変数の唯一の一覧に更新）
- `README.md`（本番ビルド失敗の案内を1行追加）

### テストコード（tests）

- `tests/unit/production-env-guard.test.ts`（新規。7 it）

## なぜ

issue #90。本番ビルドがサンプル／モック設定のまま作られることをビルド時点で失敗させて止める。設計書:
`改修プラン/三上issue_2026-09/frontend_90_本番ビルド誤設定検知.md`。

## 実行コマンドと結果（実測）

```bash
npx tsc -b --pretty false
```
→ exit 0

```bash
npx eslint vite.config.ts src/shared/config/productionEnvGuard.ts src/features/admin/components/AdminSidebar.tsx --max-warnings 0
```
→ exit 0

```bash
npm --prefix tests run test
```
→ 26 test files / 190 tests すべて成功（新規 `production-env-guard.test.ts` は 7 tests）

### T-1: 正しい本番設定 → ビルド成功

```bash
VITE_DATA_SOURCE=api VITE_MOCK_API=false VITE_API_BASE_URL=https://example.run.app/api/v1 \
VITE_DEV_EVENT_ID=20000000-0000-4000-8000-000000000001 npm run build
```
→ **exit 0（要注記。下記メモ参照）**

### T-2: `VITE_DATA_SOURCE` が `'api'` でない → ビルド失敗

```bash
VITE_DATA_SOURCE= VITE_MOCK_API=false VITE_API_BASE_URL=https://example.run.app/api/v1 \
VITE_DEV_EVENT_ID=20000000-0000-4000-8000-000000000001 npm run build
```
→ exit 1。標準エラーに `VITE_DATA_SOURCE は 'api' を明示してください（現在: ）` を含む

### T-3: `VITE_MOCK_API=true` → ビルド失敗

```bash
VITE_DATA_SOURCE=api VITE_MOCK_API=true VITE_API_BASE_URL=https://example.run.app/api/v1 \
VITE_DEV_EVENT_ID=20000000-0000-4000-8000-000000000001 npm run build
```
→ exit 1。標準エラーに `VITE_MOCK_API は 'false' を明示してください（現在: true）` を含む

### T-4: `npm run dev` は従来どおり起動する（検査は走らない）

```bash
npm run dev &
curl -s http://localhost:5173/ | grep -c root
```
→ `1`（**注記**: 設計書記載の `http://127.0.0.1:5173/` はこの実行環境では接続できず(`HTTP_STATUS=000`)、`localhost` 宛てで確認した。dev サーバーが IPv6 の `localhost` のみで listen していたため。コードの問題ではなく環境依存）

### T-5: 成果物に開発用ログイン既定値が含まれない

```bash
grep -rl "password123\|VITE_DEV_LOGIN\|a@a" dist/
```
→ 0 件（T-1 の dist に対して実行。§7-4 の限定修正は不要だった）

### build-env コメントの確認

```bash
grep -n "build-env:" dist/index.html
```
→ `<!-- build-env: data-source=api mock-api=false -->`

## 環境

- ブランチ: `feat/production-env-guard`
- データソース: `api`（T-1〜T-3・T-5 の対象）／`sample`・`api` 双方を unit test でカバー
- 関連 PR / Issue: #90

## 結果

成功。tsc・eslint・unit test・T-1〜T-5・build-env 埋め込みすべて実測で確認した。

## メモ（重要・実装時に判明した事実）

- **F13 で言及された「process.env の VITE_* を優先して含む」に加えて、Vite の `loadEnv(mode, envDir, prefix)` はモードに関わらず常にベースの `.env`（`.env.[mode]` ではない方）も読む。** これは Vite 公式仕様（`.env` は全モード共通、`.env.[mode]` がモード限定）であり、本 issue の検査導入によって初めて挙動が露呈した。
- このリポジトリのローカル作業ツリーには通常の開発セットアップ（`cp .env.example .env`、README の案内どおり）で作成された `.env` があり、そこに `VITE_DEV_LOGIN_EMAIL` 等が設定されていた。ガードレールにより `.env` の中身は見ていない・変更していない。
- そのため、設計書 §6 の T-1〜T-3 のコマンドを**そのまま**実行すると、CLI で明示していない `VITE_DEV_LOGIN_EMAIL` / `VITE_DEV_LOGIN_PASSWORD` / `VITE_DEV_DISPLAY_NAME`（ローカル `.env` 由来）が本番検査に混入し、T-1 ですら意図せず失敗する。上記の実行コマンドでは、この3キーを明示的に空文字で上書き（`VITE_DEV_LOGIN_EMAIL=` 等）して `.env` に触れずに CLI 経路のみを検証した。
- 同様に T-2 も「`VITE_DATA_SOURCE=api` を外す」だけでは、ローカル `.env` の値（このマシンでは `api` だった）にフォールバックしてしまい失敗を再現できなかったため、`VITE_DATA_SOURCE=` と明示的に空文字を渡して検証した。
- **これはガードの誤り・誤動作ではない**（むしろ「本番相当のビルド環境に開発用資格情報が紛れ込んでいたら止める」という設計意図どおりの動作）。ただし Cloud Build / GitHub Actions CI は毎回フレッシュチェックアウトのため `.env` は存在せず、本番・CI では今回の現象は起きない。ローカルで `npm run build` を素で試す開発者だけが影響を受ける。
- 三上くんへの申し送り: ローカルで本番ビルドを試す際は、`.env` に開発用ログイン変数（`VITE_DEV_LOGIN_EMAIL` 等）を設定していると `npm run build` が失敗し得ることを認識しておくこと（`docs/reference/development.md` にこの旨の追記は今回範囲外・§8 系の追加提案として検討可）。
