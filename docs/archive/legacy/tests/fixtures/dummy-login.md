# ローカル開発用ダミーログイン情報

**用途:** UI の入力確認や API 接続テストのたたき台。本番・共有環境では使わない。

## バックエンドなし（既定・モック認証）

`npm run dev` では **モック認証** が有効（`VITE_MOCK_API=false` を書かない限り）。

| 項目 | 値 |
|------|-----|
| イベント ID（内部） | `0000` |
| メール | `a@a` |
| パスワード | `password` |

実 API に切り替えるときは `frontend/.env` に `VITE_MOCK_API=false` と `VITE_DATA_SOURCE=api` を設定する（下記「実バックエンド接続時」）。

## 実バックエンド接続時（`server/` + MySQL）

1. ルートで `docker compose up -d mysql`（初回は `db/migrations` が流れる）
2. `cd server && cp .env.example .env` を編集（`DATABASE_URL` / `JWT_SECRET` / `WEBHOOK_API_KEY`）
3. `npm run db:seed` で開発用イベントを投入（**イベント ID は固定 UUID**）
4. フロントの `frontend/.env` に次を設定:
   - `VITE_MOCK_API=false`
   - `VITE_DATA_SOURCE=api`（ブース一覧・ホームを Fastify v1 経由にする）
   - `VITE_API_BASE_URL=http://localhost:3000/api/v1`（未設定なら Vite プロキシで同 URL）
   - （任意）`VITE_DEV_EVENT_ID=20000000-0000-4000-8000-000000000001` — 未設定時はログイン画面から同 UUID が自動で使われる

シード後の **`event_id`（ログイン・登録 API の `event_id` に使う値）:**

| 項目 | 値 |
|------|-----|
| イベント ID | `20000000-0000-4000-8000-000000000001` |
| メールアドレス | `dev@example.com`（`npm run db:seed` で投入。未作成時はシードを再実行） |
| パスワード | `password123` |
| 表示名 | `開発用参加者` |

ログイン画面・新規登録画面の初期値は上記（`VITE_MOCK_API=false` 時）。別ユーザーを試す場合は `/register` から登録する。

旧モック用の短い `0000` は **Fastify API では使えない**（UUID 形式が必須）。

### 手動コードでチェックイン試験

シード済みブースの例: `DEV001` / `DEV002` / `DEV003`（イベント内一意の 6 文字）。

## フロントでの使い方

- **`npm run dev`（開発モード）**では、環境変数未設定時も上表のメール・パスワードがログイン画面の初期表示になる（`frontend/src/mocks/devDummyCredentials.ts` と同一）。イベント ID は画面に出さない。
  - **モック認証**（既定）: `event_id` は `0000`（`DEV_DUMMY_EVENT_ID`）
  - **実 API**（`VITE_MOCK_API=false`）: `event_id` はシード UUID（`SEED_DEV_EVENT_ID`）。`VITE_DEV_EVENT_ID` で上書き可。
- E2E 手順の詳細は [frontend/AGENTS.md](../../../frontend/AGENTS.md) の「実 API 接続」。

## 関連

- API のリクエスト形式: [docs/designs/api.md](../../designs/api.md)（認証まわり）
