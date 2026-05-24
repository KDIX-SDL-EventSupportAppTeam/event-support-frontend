# event-support-frontend — エージェント向けガイド

Cursor / AI エージェントがこのリポジトリで作業するときの指針。
アーキテクチャの概要は [README.md](./README.md) を参照。

## スタック

React 19 + TypeScript + Vite + Zustand + axios + Bootstrap（SCSS）。

## 境界（守ること）

| やる | やらない |
|---|---|
| 画面描画・ユーザー操作のハンドリング | ビジネスロジック・データ集計 |
| `event-support-server` 経由の REST / WebSocket | DB への直接アクセス |
| JWT の保持とリクエストへの付与 | `event-support-recommender` への直接通信 |

推薦結果・集計値は必ず server の API レスポンスを表示するだけに留める。

## ディレクトリ

### 目標構成

README のとおり `src/features/*` + `src/shared/*`。
**feature 間の直接 import は禁止。** 共有が必要なものは `shared/` に置く。

各 feature の想定イメージ:

```
features/auth/      pages, store, hooks
features/booth/     pages, hooks, api（feature 固有）
features/checkin/
features/home/
features/survey/
features/admin/     運営ダッシュボード（Issue #8）
```

### 現状（移行中）

モノレポから独立直後のため、旧構成が残っている。新規・改修コードは目標構成に寄せる。

| 現状 | 移行先 |
|---|---|
| `src/pages/` | `src/features/*/pages/` |
| `src/api/` | `src/shared/api/` |
| `src/stores/` | 各 feature の store |
| `src/hooks/`（汎用） | `src/shared/hooks/` |
| `src/data/` | feature 固有 API + server 経由（段階的に廃止） |

大規模なファイル移動は機能単位の PR で行い、1 PR で全体を動かさない。

## データ層（移行期）

`EventDataSource`（`src/data/EventDataSource.ts`）と `ParticipantClient`（`src/data/participantTypes.ts`）が画面から参照するデータ契約。
`createEventDataSource()` / `createParticipantClient()` で実装を切り替える。

| モード | 用途 | 実装 |
|---|---|---|
| `sample`（開発既定） | バックエンド不要で UI 確認 | `src/data/sample/` |
| `api` | 実 server 接続 | `src/data/api/` |

- **認証:** `src/api/auth.ts` — `VITE_MOCK_API=false` 時に `POST /api/v1/auth/login` 等（モックは `src/mocks/authMock.ts`）
- **v1:** ブース・チェックイン等 — Fastify `/api/v1`
- **legacy:** ガチャ・投票等 — 旧 Flask `/api`（段階的に v1 へ移行予定）

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

Vite プロキシ（`vite.config.ts`）: `/api/v1` → `127.0.0.1:3000`、`/api` → `127.0.0.1:5000`。

### 実 API 接続

1. `event-support-server` を起動（`:3000`）
2. `.env` に `VITE_MOCK_API=false` と `VITE_DATA_SOURCE=api`
3. `npm run dev` → ログイン（シード: `dev@example.com` / `password123`）

`event_id` の正: [docs/legacy/tests/fixtures/dummy-login.md](./docs/legacy/tests/fixtures/dummy-login.md)

## コーディング規約

- TypeScript strict。any は避ける
- パスエイリアス `@/` → `src/`
- feature 間 import 禁止 → 共有は `shared/` へ抽出
- API 呼び出しは `shared/api`（移行後）または既存 `src/api/` 経由。画面コンポーネントに axios を直書きしない
- スタイルは feature 固有を co-locate、共通は `src/styles/`
- 本番ビルド（`npm run build`）ではモックをバンドルしない

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

### レガシー（参照のみ）

モノレポ時代の設計・ADR・テスト記録は `docs/legacy/` に退避済み。新規追加はしない。

- 設計: [docs/legacy/designs/frontend.md](./docs/legacy/designs/frontend.md)
- ADR: [docs/legacy/adrs/](./docs/legacy/adrs/)
- テスト記録: [docs/legacy/tests/](./docs/legacy/tests/)

---

## 次にやること

**PR を作成するたびに、このセクションを更新すること。** 完了した項目は削除し、次の PR で取り組む内容を書く。

- [ ] `.env.example` をマルチレポ向けに更新（`VITE_API_URL`・`VITE_SOCKET_URL` 等）
- [ ] `src/` を `features/` + `shared/` 構成へ段階的に移行（feature 単位の PR）
