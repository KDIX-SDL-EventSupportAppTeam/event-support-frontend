# フロントエンド（React）

**スタック:** Vue からのリプレイス — React 19 + TypeScript + Vite + Zustand + axios。見た目・主要ルートは旧 Vue アプリに寄せ、Bootstrap（SCSS）で再現している。

**データ:** `EventDataSource`（`src/data/EventDataSource.ts`）が画面から参照する唯一の契約。実装は `createEventDataSource()`（`src/data/createEventDataSource.ts`）で切り替える。

**参加者のその他機能（ガチャ・チェックイン・投票・スケジュール・Q&A）:** `ParticipantClient`（`src/data/participantTypes.ts`）を `createParticipantClient()`（`src/data/createParticipantClient.ts`）で生成。`sample` は `SampleParticipantClient`（セッションでチェックイン・ガチャ消費・投票を追補）、`api` は `ApiParticipantClient`（旧 Flask の `/api/*` と `POST /checkin`）。

- **`sample`（開発既定）:** `SampleEventData` / `SampleEventDataSource`（`src/data/sample/`）。ビンゴカードは `eventId` と `userId` から決定論的にランダム配置（`bingoRandom.ts`）。本番アプリ本体からはインポートしない。
- **`api`:** `ApiEventDataSource`（`src/data/api/`）が Fastify の **`GET /api/v1/events/:event_id/booths`**・**`GET .../checkins`** を利用。ビンゴは v1 未実装のため `bingoRandom.ts` でクライアント組み立て。賞は空配列。

## 開発

```bash
npm install
npm run dev
```

**認証（設計の v1 REST）:** `src/api/auth.ts` は `VITE_MOCK_API=false` のとき [api.md](../../docs/designs/api.md) の **`POST /api/v1/auth/login` 等**を叩く。ベース URL は `VITE_API_BASE_URL`（未設定時は相対 `/api/v1`）。Vite のプロキシ先は `vite.config.ts`（既定 **127.0.0.1:3000** = リポジトリの **`server/`**）。手順の整理は [server/AGENTS.md](../../server/AGENTS.md) と [docs/tests/fixtures/dummy-login.md](../../docs/tests/fixtures/dummy-login.md)。

**旧参加者 API（Flask 等）:** `VITE_LEGACY_API_BASE_URL`（未設定時は相対 `/api`）。`ApiParticipantClient`（ガチャ・旧チェックイン・投票等）が引き続き利用。ブース一覧・ホームのビンゴは **`api` でも v1**。

**バックエンドなし:** `npm run dev` では `VITE_MOCK_API` が `false` でない限り **認証 API はモック**（`src/mocks/authMock.ts`）。実サーバーに切り替えるときは `.env` に `VITE_MOCK_API=false` を設定する。本番ビルド（`npm run build`）ではモックは使われない。

**ブース・ビンゴ・賞:** `VITE_DATA_SOURCE=api` で v1（上記）。未設定の開発では **`sample`**。

### 実 API 接続（E2E たたき台）

1. ルートで `docker compose up -d mysql` → `cd server && npm run db:migrate`（初回のみ）→ `npm run db:seed`
2. `cd server && npm run dev`（:3000）
3. `cd frontend` で `.env` に少なくとも:
   - `VITE_MOCK_API=false`
   - `VITE_DATA_SOURCE=api`
   - （任意）`VITE_DEV_EVENT_ID=20000000-0000-4000-8000-000000000001` — 未設定時も実 API ログインではシード UUID を自動使用
4. `npm run dev` → ログイン（`dev@example.com` / `password123`。未作成なら `cd server && npm run db:seed`）または `/register` で登録 → ホーム・ブース一覧でシードブースが表示されること

`event_id` の正: [docs/tests/fixtures/dummy-login.md](../docs/tests/fixtures/dummy-login.md)

## 参照

- リポジトリ全体: ルート `AGENTS.md`
- 設計: [docs/designs/frontend.md](../docs/designs/frontend.md)（将来の整理用。現 UI は旧 Vue 準拠。差分は [designs/README.md](../docs/designs/README.md) 末尾）
- **v1 API（Fastify）:** [server/AGENTS.md](../../server/AGENTS.md) · [docs/designs/api.md](../docs/designs/api.md)
- 決定記録: [docs/adrs/](../docs/adrs/)
- 作業メモ: [docs/orders/](../docs/orders/)
- テスト実行記録: [docs/tests/README.md](../docs/tests/README.md)
