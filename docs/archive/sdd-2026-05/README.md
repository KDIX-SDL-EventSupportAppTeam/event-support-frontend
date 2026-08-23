# SDD: 主催者によるイベント自己管理機能（フロントエンド）

主催者（団体）が GUI でイベントを作成・編集し、発行された URL から参加者画面・運営画面が開ける機能のフロント側仕様書。サーバー仕様は `event-support-server/.sdd/` を正本とし、本書は UI・ルーティング・状態管理を定義する。

## スコープ

1. **主催者ポータル**（新規 feature `features/organizer/`）— 主催者のログイン／イベント一覧／作成・編集フォーム／発行 URL 表示
2. **URL 入口の追加** — 参加者 URL `/join/:eventId` と運営 URL `/admin/login?event=:eventId` をルーティングで受け取り、登録/ログインフォームに event_id を自動セット
3. **既存画面は無変更** — `/home`・`/checkin`・`/admin/*` 等のロジックは触らない

## 設計の核心

- 既存アプリは URL に event_id を持たず、JWT から取得する**イベント非依存ルーティング**。本機能はこれを壊さず、「入口だけ event_id を URL から受けてフォームに渡す」薄い層を足す。
- 主催者ポータルは既存の参加者/運営とは**別の認証状態**で動く（主催者 JWT）。authStore を汚さないよう独立 store を持つ。
- **再デプロイ・ビルド構成変更は不要。** SPA catch-all リライト（`firebase.json` / `app.yaml`）が新パスを `index.html` に解決する。

## ドキュメント構成

| ファイル | 内容 |
|----------|------|
| [01-overview.md](./01-overview.md) | 全体像・feature 構成・影響範囲 |
| [02-routing-urls.md](./02-routing-urls.md) | ルーティング追加と URL 規約（サーバーとの契約） |
| [03-screens.md](./03-screens.md) | 主催者ポータル画面仕様・コンポーネント分割 |
| [04-state-api.md](./04-state-api.md) | 状態管理（organizerStore）と API クライアント |

## ユビキタス言語の追加提案

`docs/ubiquitous-language.md` に追加（サーバー側と表記統一）。

| UI 用語 | 意味 |
|---------|------|
| 主催者ポータル | 主催者がイベントを管理する画面群（`/organizer/*`） |
| イベント作成フォーム | 概要入力 → 作成 → URL 表示までの一連の画面 |
| 発行 URL カード | 作成完了後に参加者 URL・運営 URL を提示しコピーさせる UI |
