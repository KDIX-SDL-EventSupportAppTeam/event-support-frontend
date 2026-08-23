---
状態: 実装済み
最終更新: 2026-08-24
---

> **現状の事実を記録する文書。** 「これからどうするか」は [../specs/](../specs/README.md) を見ること。

# 開発・ビルド・デプロイ

```bash
cp .env.example .env
npm install
npm run dev    # http://localhost:5173
```

### 環境変数（`.env.example` 参照）

| 変数 | 説明 |
|---|---|
| `VITE_MOCK_API` | `false` で実認証 API。開発既定はモック |
| `VITE_DATA_SOURCE` | `sample`（既定）\| `api`（server 接続） |
| `VITE_API_BASE_URL` | v1 API ベース（未設定時は相対 `/api/v1`） |
| `VITE_LEGACY_API_BASE_URL` | 旧参加者 API（未設定時は相対 `/api`） |
| `VITE_DEV_EVENT_ID` | ローカル用 event_id（実 API 時） |
| `VITE_DEV_LOGIN_EMAIL` | JoinPage/RegisterPage/LoginPage の開発用初期値（DEV ビルドのみ反映） |
| `VITE_DEV_LOGIN_PASSWORD` | 同上のパスワード初期値 |
| `VITE_DEV_DISPLAY_NAME` | JoinPage/RegisterPage の表示名初期値（DEV ビルドのみ反映） |
| `VITE_FEEDBACK_FORM_URL` | ホーム画面のフィードバックフォームリンク |

Vite プロキシ（`vite.config.ts`）: `/api/v1` → `127.0.0.1:3000`、`/api` → `127.0.0.1:5000`。

### 実 API 接続

1. `event-support-server` を起動（`:3000`）
2. `.env` に `VITE_MOCK_API=false` と `VITE_DATA_SOURCE=api`
3. `npm run dev` → ログイン（シード: `dev@example.com` / `password123`）

`event_id` の正: [docs/archive/legacy/tests/fixtures/dummy-login.md](../archive/legacy/tests/fixtures/dummy-login.md)

### エントリポイント（トップ `/`）

| パス | 着地先 / 画面 |
|---|---|
| `/` | `/organizer/login` へリダイレクト（オーガナイザーが主たる入口） |
| `/organizer/login` | オーガナイザーログイン（ログイン後は `/organizer/events` へ） |
| `/organizer/events` | 主催者イベント一覧（ログイン後の着地先。ステータスバッジ・統計・URL コピー） |
| `/organizer/events/new` | イベント作成 |
| `/organizer/events/:eventId` | イベント詳細（URL 再表示・スタッフ一覧/ロール変更/削除・イベントデータ全削除） |
| `/join/:eventId` | 参加者の入口。イベント個別の QR / リンクから登録 → `/home`。公開イベント情報でイベント名を表示 |
| `/login`・`/register` | 参加者ログイン / 登録（トップからは導線なし。直接 URL でのみ到達） |

主催者ポータルの共通レイアウト: `features/organizer/components/OrganizerShell.tsx`（ヘッダー・ログアウト）。

経緯・判断は [docs/decisions/adrs/0002-top-redirects-to-organizer-login.md](../decisions/adrs/0002-top-redirects-to-organizer-login.md)。

### 運営画面（admin）

| パス | 画面 | 権限 |
|---|---|---|
| `/admin/login` | 運営ログイン（manager または viewer の JWT が必要。旧 admin は互換扱い） | — |
| `/admin/menu` | 運営メニュー（分析ウィンドウ群。サイドバー表示は「分析ボード」） | 閲覧: viewer 可 |
| `/admin/dashboard` | リアルタイム統計・WebSocket 通知（サイドバー表示は「リアルタイム」） | 閲覧: viewer 可 |
| `/admin/booths` | ブース CRUD | 閲覧: viewer 可 / 編集・削除: manager のみ |
| `/admin/categories` | カテゴリ CRUD | 閲覧: viewer 可 / 編集・削除: manager のみ |
| `/admin/survey` | アンケート設問 CRUD | 閲覧: viewer 可 / 編集・削除: manager のみ |
| `/admin/participants` | 参加者一覧・検索・削除 | 閲覧: viewer 可 / 削除: manager のみ |
| `/admin/audit-logs` | 操作履歴（監査ログ）閲覧 | 閲覧: viewer 可 |
| `/admin/sample` | サンプル生成・削除（サイドバー表示は「データ編集」）。イベントデータ全削除は organizer ポータルの `/organizer/events/:eventId` に移設 | manager のみ（viewer はサイドバー非表示） |
| `/admin/exhibitors` | 出展者アカウント一括登録（貼り付け→プレビュー→確定。サイドバー表示は「出展者登録」） | manager のみ（viewer はサイドバー非表示・ページ内でも二重にガード） |

共通レイアウト: `features/admin/components/AdminShell.tsx`（上部ナビ・ログアウト）。

**ローカル確認手順**

1. `event-support-server` で `npm run db:seed` 済みであること
2. 運営ユーザーを API で作成（初回のみ）:

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/register/admin \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: change-admin-registration-key-in-dev" \
  -d '{"event_id":"20000000-0000-4000-8000-000000000001","email":"admin@example.com","password":"admin1234","display_name":"運営担当"}'
```

3. フロント `.env` で `VITE_MOCK_API=false` / `VITE_DATA_SOURCE=api` / `VITE_API_BASE_URL=http://localhost:3000/api/v1`
4. http://localhost:5173/admin/login から上記アカウントでログイン

サーバー側の運営 API・WebSocket 仕様は [event-support-server/docs/archive/orders/2026-06-16-完了-運営CRUD-ダッシュボード-WebSocket実装.md](../../../event-support-server/docs/archive/orders/2026-06-16-完了-運営CRUD-ダッシュボード-WebSocket実装.md)。

### 出展者ダッシュボード（/exhibitor）

| パス | 画面 | 権限 |
|---|---|---|
| `/exhibitor` | 出展者ダッシュボード（担当ブースのチェックイン総数・時間帯別グラフ・コメント一覧。60秒ポーリング） | `RequireAuth`（ログイン済みなら誰でも到達可）。出展者かどうかの判定は非同期 API 依存のためガードでは行わず、ページ内で「ロード中→権限なし→担当ブース0→通常表示」の順に分岐する |

- 参加者ホーム（`/home`）は `useExhibitorStore` の `isExhibitor`（`GET /events/:event_id/exhibitor/booths` をセッション中1回だけ取得してキャッシュ）が true のときだけ「出展者画面へ」ボタンを表示する。`user.role` の OR は取らない（localStorage の role はログイン時点のスナップショットで、一括登録による後付けロール付与が反映されないため）。
- 一括登録（`/admin/exhibitors`）は既存参加者にも出展者ロールを後付けできる。反映確認は再ログイン不要（`/home` のリロードで `ensureLoaded` が再取得する）。
- 実装: `features/exhibitor/store/exhibitorStore.ts`（is_exhibitor・担当ブースのキャッシュ）、`features/exhibitor/hooks/useExhibitorStats.ts`（stats 取得＋60秒ポーリング。admin フィーチャーからは越境 import しない）、`features/exhibitor/pages/ExhibitorDashboardPage.tsx`。API 型・fetch 関数は `shared/api/v1Exhibitor.ts`、一括登録は `shared/api/v1Admin.ts` の `bulkRegisterExhibitors`。
- モック/サンプルモード（`VITE_MOCK_API=true` / `VITE_DATA_SOURCE=sample`）に出展者 API のモックは無い（`exhibitorStore` が常に非出展者を返す）。出展者画面の動作確認は実 API モード必須。
- 設計書: [改修プラン/三上issue_2026-07/frontend_43_出展者管理画面.md（改修プラン・リポジトリ外）（サーバー側 API 契約は `server_53_出展者ロール集計API.md` が正）。

## 本番ビルド・デプロイ

### `.env.production` の用意

Vite は `npm run build` 時に **`.env.production`** を自動で読む。
リポジトリには `.env.production.example` のみコミットしており、本番ビルド前に各環境でコピー・上書きする。

```bash
cp .env.production.example .env.production
# VITE_API_BASE_URL を Cloud Run の URL に書き換える
npm run build
```

| 変数 | 本番での想定値 |
|---|---|
| `VITE_DATA_SOURCE` | `api` |
| `VITE_MOCK_API` | `false` |
| `VITE_API_BASE_URL` | `https://event-support-server-xxxxxx-an.a.run.app/api/v1`（Cloud Run の URL） |

> `VITE_` 接頭辞付きの値は **クライアントバンドルに埋め込まれて公開される**。秘密情報は絶対に置かない。

### デプロイ先

Firebase Hosting（`firebase.json` / `.firebaserc` がリポ直下に存在）。

```bash
cp .env.production.example .env.production
# VITE_API_BASE_URL を Cloud Run の URL に書き換える
npm run build
firebase deploy --only hosting --project event-support-app
```

本番 URL 例: `https://event-support-app.web.app`

サーバー側のデプロイ手順は [event-support-server/docs/deploy/cloud-run.md](../../../event-support-server/docs/operations/cloud-run.md)。
デプロイ後、Cloud Run の `CORS_ORIGIN` にフロント URL（`.web.app` と `.firebaseapp.com`）を設定する。
