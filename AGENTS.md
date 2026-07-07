# event-support-frontend — エージェント向けガイド

Cursor / AI エージェントがこのリポジトリで作業するときの指針。
アーキテクチャの概要は [README.md](./README.md) を参照。

## スタック

React 19 + TypeScript + Vite + Zustand + axios + Bootstrap（SCSS）。

## ユビキタス言語

**用語は [docs/ubiquitous-language.md](./docs/ubiquitous-language.md) を正とする。** 参加者 / ブース / チェックイン / 推薦などの呼び方をコード・ドキュメント・会話すべてで揃える。新語や変更は本ファイルではなく `docs/ubiquitous-language.md` を更新する。

## 境界（守ること）

| やる | やらない |
|---|---|
| 画面描画・ユーザー操作のハンドリング | ビジネスロジック・データ集計 |
| `event-support-server` 経由の REST / WebSocket | DB への直接アクセス |
| JWT の保持とリクエストへの付与 | `event-support-recommender` への直接通信 |

推薦結果・集計値は必ず server の API レスポンスを表示するだけに留める。

## ディレクトリ

### ディレクトリ構成

```
src/
├── features/
│   ├── auth/          # ログイン・登録・認証（store, hooks, api, mocks）
│   ├── home/          # ホーム・ビンゴ
│   ├── booth/         # ブース一覧
│   ├── checkin/       # チェックイン・評価・推薦
│   ├── gachapon/      # ガチャポン
│   ├── award/         # アワード投票
│   ├── schedule/      # スケジュール
│   ├── qa/            # Q&A
│   ├── admin/         # 運営管理（ダッシュボード・CRUD）
│   └── organizer/     # 主催者ポータル（guards / pages / store / api / components）
├── shared/
│   ├── api/           # v1 / legacy HTTP クライアント
│   ├── auth/          # 認証セッション（authStore・AuthUser 型・モック判定）
│   ├── data/          # EventDataSource / ParticipantClient（移行期）
│   ├── hooks/         # 複数 feature から使う hooks
│   ├── types/         # 共通型
│   ├── lib/           # ユーティリティ
│   └── styles/        # グローバル SCSS
├── router/
│   └── index.tsx
├── App.tsx
└── main.tsx
```

**原則：feature 間の直接 import は禁止。** 共有は `shared/` に置く。認証セッション（token・user・ロール判定）は `shared/auth/` に置き、`features/auth/` には画面と認証 API フローのみを残す（[ADR 0003](./docs/adrs/0003-move-auth-session-to-shared.md)）。

| feature | 主なパス |
|---------|----------|
| auth | `features/auth/{pages,hooks,api,mocks,config,types}` |
| home | `features/home/{pages,hooks,styles}` |
| booth | `features/booth/{pages,styles}` |
| checkin | `features/checkin/pages` |
| gachapon | `features/gachapon/pages` |
| award | `features/award/{pages,hooks}` |
| schedule / qa | `features/{schedule,qa}/pages` |
| admin | `features/admin/{pages,components}` · API: `shared/api/v1Admin.ts` |
| organizer | `features/organizer/{pages,store,api,guards,components}` |

## データ層（移行期）

`EventDataSource`（`src/shared/data/EventDataSource.ts`）と `ParticipantClient`（`src/shared/data/participantTypes.ts`）が画面から参照するデータ契約。
`createEventDataSource()` / `createParticipantClient()` で実装を切り替える。

| モード | 用途 | 実装 |
|---|---|---|
| `sample`（開発既定） | バックエンド不要で UI 確認 | `src/shared/data/sample/` |
| `api` | 実 server 接続 | `src/shared/data/api/` |

- **認証:** `features/auth/api/auth.ts` — `VITE_MOCK_API=false` 時に `POST /api/v1/auth/login` 等（モックは `features/auth/mocks/`）
- **v1:** ブース・チェックイン等 — `shared/api/v1Participant.ts`
- **legacy:** ガチャ・投票等 — `shared/api/legacyParticipant.ts`（段階的に v1 へ移行予定）

## 開発

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

`event_id` の正: [docs/legacy/tests/fixtures/dummy-login.md](./docs/legacy/tests/fixtures/dummy-login.md)

### エントリポイント（トップ `/`）

| パス | 着地先 / 画面 |
|---|---|
| `/` | `/organizer/login` へリダイレクト（オーガナイザーが主たる入口） |
| `/organizer/login` | オーガナイザーログイン（ログイン後は `/organizer/events` へ） |
| `/organizer/events` | 主催者イベント一覧（ログイン後の着地先。ステータスバッジ・統計・URL コピー） |
| `/organizer/events/new` | イベント作成 |
| `/organizer/events/:eventId` | イベント詳細（URL 再表示・スタッフ一覧/ロール変更/削除） |
| `/join/:eventId` | 参加者の入口。イベント個別の QR / リンクから登録 → `/home`。公開イベント情報でイベント名を表示 |
| `/login`・`/register` | 参加者ログイン / 登録（トップからは導線なし。直接 URL でのみ到達） |

主催者ポータルの共通レイアウト: `features/organizer/components/OrganizerShell.tsx`（ヘッダー・ログアウト）。

経緯・判断は [docs/adrs/0002-top-redirects-to-organizer-login.md](./docs/adrs/0002-top-redirects-to-organizer-login.md)。

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
| `/admin/sample` | サンプル生成・イベント全データ削除（サイドバー表示は「データ編集」） | manager のみ（viewer はサイドバー非表示） |

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

サーバー側の運営 API・WebSocket 仕様は [event-support-server/docs/orders/2026-06-16-完了-運営CRUD-ダッシュボード-WebSocket実装.md](../event-support-server/docs/orders/2026-06-16-完了-運営CRUD-ダッシュボード-WebSocket実装.md)。

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

サーバー側のデプロイ手順は [event-support-server/docs/deploy/cloud-run.md](../event-support-server/docs/deploy/cloud-run.md)。
デプロイ後、Cloud Run の `CORS_ORIGIN` にフロント URL（`.web.app` と `.firebaseapp.com`）を設定する。

## コーディング規約

- TypeScript strict。any は避ける
- パスエイリアス `@/` → `src/`
- feature 間 import 禁止 → 共有は `shared/` へ抽出
- API 呼び出しは `shared/api` 経由。画面コンポーネントに axios を直書きしない
- スタイル: feature 固有は `features/*/styles/`、共通は `shared/styles/`
- 本番ビルド（`npm run build`）ではモック認証は無効化され、開発用初期値（ログイン/登録フォームの事前入力）も一切表示されない

## テスト

| 場所 | 役割 |
|------|------|
| [`tests/`](./tests/) | Vitest のテストコード（`unit/`・`integration/`）。**ここにまとめる** |
| [`docs/tests/`](./docs/tests/) | 実行記録（`runs/`）・フィクスチャ（`fixtures/`） |

- `src/` 内に `*.test.ts` を置かない
- テスト追加・実行後は [docs/tests/runs/_template.md](./docs/tests/runs/_template.md) に沿って `docs/tests/runs/` に記録を残し、対象 `src/` ファイルと `tests/**/*.test.ts` のパスを書く
- 詳細: [tests/README.md](./tests/README.md) · [docs/tests/README.md](./docs/tests/README.md)

## 関連リポジトリ

| リポジトリ | 参照先 |
|---|---|
| `event-support-server` | API 仕様・起動手順は server 側 README / AGENTS.md |
| `event-support-recommender` | 直接呼ばない（server 経由） |

## ドキュメント

### 追加先（新規はここ）

| ディレクトリ | 用途 |
|---|---|
| [docs/adrs/](./docs/adrs/) | Architecture Decision Records（設計判断の記録） |
| [docs/tests/](./docs/tests/) | テスト計画・実行記録・フィクスチャ（コードは [`tests/`](./tests/)） |
| [docs/orders/](./docs/orders/) | 作業指示・実装メモ |

**新規の ADR・テスト記録・作業メモは `docs/legacy/` ではなく、上記ディレクトリに追加する。**
README / 本ファイルを正とし、legacy は参照用のみ。

### AI エージェント向け

| ファイル | 用途 | 役割 |
|----------|------|------|
| [AGENTS.md](./AGENTS.md) | 詳細ガイド（正本） | 人間・全 AI |
| [CLAUDE.md](./CLAUDE.md) | Claude Code 向け | 設計・要件定義（コードは書かない） |
| [.cursor/rules/](./.cursor/rules/) | Cursor Project Rules | **実装**（指示に従いコードを書く） |
| [docs/cursor/](./docs/cursor/) | テンプレート・更新用メモ | — |

#### Cursor（実装担当）

Cursor はユーザーの指示に従ってコードを書く。技術詳細は本ファイル（AGENTS.md）を参照すること。

| 項目 | 方針 |
|------|------|
| コマンド | 必要なものは自由に実行可。重大なバグ・ユーザー介入が必要な場合は中止して報告 |
| コミット | **日本語**、後から確認しやすい**細かい粒度**（1 意図 = 1 コミット）。明示的な依頼がない限り勝手にコミットしない |
| PR | タイトル・本文・コメントは**日本語**。作成時は「次にやること」を更新 |
| ドキュメント | 作業区切りごとに **AGENTS.md** と **docs/**（`adrs` / `tests` / `orders`）を**細かく頻繁に**更新 |

詳細: [.cursor/rules/cursor-workflow.mdc](./.cursor/rules/cursor-workflow.mdc)

- 繰り返し適用する規約は **必要に応じて** `.cursor/rules/*.mdc` を追加し、[docs/cursor/README.md](./docs/cursor/README.md) を更新

#### Claude Code（設計担当）

設計・要件定義が主務。明示的な指示がない限りコードを書かない。詳細: [CLAUDE.md](./CLAUDE.md)

- 繰り返し参照する設計方針は **必要に応じて** [CLAUDE.md](./CLAUDE.md) または `docs/adrs/` に追加
- Cursor 実装時の規約は `.cursor/rules/` への追加を提案

### レガシー（参照のみ）

モノレポ時代の設計・ADR・テスト記録は `docs/legacy/` に退避済み。新規追加はしない。

- 設計: [docs/legacy/designs/frontend.md](./docs/legacy/designs/frontend.md)
- ADR: [docs/legacy/adrs/](./docs/legacy/adrs/)
- テスト記録: [docs/legacy/tests/](./docs/legacy/tests/)

---

## 次にやること

**PR を作成するたびに、このセクションを更新すること。** 完了した項目は削除し、次の PR で取り組む内容を書く。

- [x] 2026-07-02 コードレビュー是正（`.sdd/2026-07-02-code-review/`）: F-1/F-2 バグ修正・A-1 authStore の shared/auth 移動・ドキュメント同期（完了）
- [ ] checkin の v1 API 呼び出しを `shared/api` または feature api 層に集約
- [ ] `shared/data/` を feature 固有 API へ段階的に分割
- [ ] `LegacyBooth` を解体し、ユビキタス言語に沿った `Booth` ドメイン型を導入する
  - 旧 Vue 由来の `booth_name` / `booth_display_code` / `booth_emoji` 等を `name` / `manual_code` / `labels`（から派生）へ
  - Flask 経由の API レスポンスは引き続き受けるためマッパーを残し、UI/ストア側で新ドメイン型へ統一
- [ ] v1 API 側 `id` / `method` を `booth_id` / `checkin_method` に揃える（server とのすり合わせが必要）
- [ ] `apiParticipantClient` で v1 `synced_at` を破棄せずに保持し、再送制御に活用する余地を確保
- [ ] `ApiErrorCode` の他コード（`UNAUTHORIZED` / `NOT_FOUND` / `VALIDATION_ERROR`）も画面側で個別ハンドリングを検討
