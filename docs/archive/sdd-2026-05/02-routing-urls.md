# 02. ルーティングと URL 規約

`src/router/index.tsx` への**追記のみ**。既存ルートと既存リダイレクトは変更しない。

## 2.1 URL 規約（サーバーとの契約）

サーバーが `POST /organizer/events` のレスポンスで返す URL と、フロントのルートは**完全一致**させる。規約を変える場合は両 `.sdd` を同時更新する。

| 用途 | URL | 受け取り方 |
|------|-----|-----------|
| 参加者入口 | `/join/:eventId` | パスパラメータ `eventId` |
| 運営入口 | `/admin/login?event=:eventId` | クエリ `event` |
| 主催者ポータル | `/organizer/*` | — |

参加者を path param、運営を query にする理由：運営は既存 `AdminLoginPage` を流用するため URL パスを増やさず query で event_id を渡すのが最小変更。参加者は新規入口なので素直な path param にする。

## 2.2 追加するルート

```tsx
// 主催者ポータル（認証は RequireOrganizer）
<Route path="/organizer/login" element={<OrganizerLoginPage />} />
<Route path="/organizer/events" element={
  <RequireOrganizer><OrganizerEventListPage /></RequireOrganizer>
} />
<Route path="/organizer/events/new" element={
  <RequireOrganizer><OrganizerEventCreatePage /></RequireOrganizer>
} />
<Route path="/organizer/events/:eventId/edit" element={
  <RequireOrganizer><OrganizerEventEditPage /></RequireOrganizer>
} />

// 参加者入口：event_id を登録フォームへ渡す
<Route path="/join/:eventId" element={<JoinPage />} />  // 下記 2.3
```

`RequireOrganizer` は `RequireAdmin` と同型だが、参照先を `organizerStore` にする（[04-state-api.md](./04-state-api.md)）。

## 2.3 参加者入口 `/join/:eventId` の挙動

新規 `JoinPage`（または `RegisterPage` の薄いラッパ）：

1. `useParams()` で `eventId` を取得
2. 既存 `RegisterPage` に `eventId` を渡し、event_id 入力を**固定値として事前充填**（ユーザーに編集させない or hidden）
3. **どのイベントに参加するかをフォーム冒頭に明示**（イベント名・日程）。表示仕様は [03-screens.md](./03-screens.md) 3.4
4. 以降は既存登録フロー（`POST /api/v1/auth/register`）に乗る。**登録 API・JWT 発行は無変更**

> 既存 `RegisterPage` が event_id をどこから取得しているか（現状はおそらく `VITE_DEV_EVENT_ID` や手入力）を実装時に確認し、「props/URL からの注入」を最小差分で足す。

## 2.4 運営入口 `?event=` の挙動

`AdminLoginPage` に小変更：

1. `useSearchParams()` で `event` を取得
2. ある場合は event_id を事前充填してログイン。無い場合は従来どおり手動入力
3. ログイン後は既存の運営 JWT フロー（無変更）

## 2.5 SPA リライトとデプロイ

- `firebase.json` / `app.yaml` は全パスを `index.html` に解決済み。`/join/:eventId`・`/organizer/*` も**設定追加なし**で動作する。
- ビルド出力・ルーティングモード（BrowserRouter 前提）は現状維持。**再デプロイ不要**（次回通常デプロイに同梱されれば足りる）。
