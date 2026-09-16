# 03. ドキュメント同期仕様

サーバー側 D-1（ユビキタス言語のロール刷新）の確定後に着手すること。
ロール表記はすべて新体系（manager / viewer / organizer）で記述する。

---

## D-1. ユビキタス言語のロール表記更新

**対象**: `docs/ubiquitous-language.md`

- 「運営 | `admin` / `organizer`」行を、サーバー側
  `event-support-server/docs/ubiquitous-language.md`（D-1 改訂後）と同じ定義に揃える:
  運営 = manager（編集可）+ viewer（閲覧のみ）、主催者 / Organizer はイベント横断の別系統
- 主催者ポータル・発行 URL カード等、`.sdd/README.md` で提案済みの UI 用語を正式追記する

---

## D-2. README.md の実装乖離の解消

**対象**: `README.md`

1. **ローカル開発節の環境変数名を修正する**:
   「`cp .env.example .env # VITE_API_URL・VITE_SOCKET_URL を設定`」
   → `VITE_API_URL` / `VITE_SOCKET_URL` は**コードに存在しない**。
   実際の変数（`VITE_API_BASE_URL`・`VITE_MOCK_API`・`VITE_DATA_SOURCE`）に書き換え、
   WebSocket の接続先は `VITE_API_BASE_URL` から自動導出される
   （`src/shared/api/socket.ts` の `resolveSocketBaseUrl`）ことを注記する
2. **ディレクトリ構造に `features/organizer/` を追加する**
   （guards / pages / store / api / components）。A-1 実施後は `shared/auth/` も追記する
3. AGENTS.md「次にやること」の「`.env.example` をマルチレポ向けに更新
   （`VITE_API_URL`・`VITE_SOCKET_URL` 等）」の項目は、本項の完了をもって
   実態に合わせて解消・削除する（`.env.example` 自体は既に正しい変数名になっている）

---

## D-3. AGENTS.md の実装乖離の解消

**対象**: `AGENTS.md`

1. **ロール表記**: 「`/admin/login`（`role: admin` の JWT が必要）」→
   「manager または viewer の JWT が必要（旧 admin は互換扱い）」。
   運営画面の各行にも閲覧のみ（viewer）と編集可（manager）の別を注記する
2. **feature 一覧表に organizer を追加する**:
   `features/organizer/{pages,store,api,guards,components}` · API: `shared/api/organizerApi` 相当
3. **運営画面の表に `/admin/sample`（サンプルデータ生成・削除）を追加する**
4. **環境変数表に不足分を追加する**（`.env.example` と一致させる）:
   `VITE_DEV_LOGIN_EMAIL` / `VITE_DEV_LOGIN_PASSWORD` / `VITE_DEV_DISPLAY_NAME` /
   `VITE_FEEDBACK_FORM_URL`
5. **「本番ビルドではモックをバンドルしない」の表現を実態に合わせる**:
   01-bugfixes.md F-1 の修正後、「本番ビルドではモック認証は無効化され、
   開発用初期値も一切表示されない」という検証可能な記述に改める

---

## D-4. `.env.production.example` から実環境の値を除去する

**対象**: `.env.production.example`

現在、実際の Cloud Run URL（`https://event-support-server-2vfu7wrxxa-an.a.run.app/...`）と
本番イベント UUID（`39563c5a-...`）がそのままコミットされている。
リポジトリを公開した場合に本番エンドポイントとイベント ID が漏れる。

- 両値をプレースホルダー（`https://<cloud-run-service-url>/api/v1`・`<本番イベントの UUID>`）に
  置き換え、取得方法（`gcloud run services describe` / DB の `events.id`）をコメントで残す

---

## D-5. コード内コメントの参照先修正 【低】

- `src/shared/api/unwrap.ts`: 「設計ドキュメント `docs/designs/api.md`」→
  実在パス `event-support-server/docs/legacy/designs/api.md`（共通レスポンス形式の定義元）へ修正
- `src/features/organizer/api/organizerApi.ts`: 「サーバー(03-api.md)」→
  `event-support-server/.sdd/03-api.md` とフルパスで記載する
  （現状の表記はどのディレクトリの 03-api.md か判別できない）

---

## D-6. AGENTS.md「次にやること」の更新

本 SDD の対応 PR を作成するたびに残項目を反映する。
F-1（本番プリフィル）の完了は最優先で反映し、完了までは既知の問題として明記しておくこと。
