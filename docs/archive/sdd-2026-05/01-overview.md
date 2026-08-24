# 01. 全体像・feature 構成・影響範囲

## 1. 3 つの利用者導線

```
主催者（団体）
  └─ /organizer/login → /organizer/events（一覧）→ /organizer/events/new（作成）
        └─ 作成完了 → 発行 URL カード（参加者URL / 運営URL を表示・コピー）
                          │
        ┌─────────────────┴───────────────────┐
        ▼                                     ▼
  参加者: /join/:eventId               運営: /admin/login?event=:eventId
   （登録フォームに event_id 自動セット）   （既存ログイン画面に event_id プリセット）
        ▼                                     ▼
   既存 /home 等へ（無変更）            既存 /admin/menu 等へ（無変更）
```

## 2. feature 構成（追加分のみ）

既存の `src/features/*` 規約に合わせ、新 feature を 1 つ追加する。

```
src/features/organizer/
  pages/
    OrganizerLoginPage.tsx        # 主催者ログイン
    OrganizerEventListPage.tsx    # 自分のイベント一覧（Phase 2）
    OrganizerEventCreatePage.tsx  # イベント作成フォーム＋発行URL表示＋スタッフ招待
    OrganizerEventEditPage.tsx    # 概要編集＋スタッフ管理（Phase 2）
  components/
    EventForm.tsx                 # 概要入力フォーム（作成/編集で共用）
    IssuedUrlCard.tsx             # 参加者URL/運営URL のコピー UI
    StaffInviteForm.tsx           # スタッフ招待（email/password/ロール）
    StaffList.tsx                 # スタッフ一覧・ロール変更・削除（Phase 2）
  store/
    organizerStore.ts             # 主催者 JWT・主催者情報（authStore とは別）
  api/
    organizerApi.ts               # 主催者系エンドポイントのクライアント
  guards/
    RequireOrganizer.tsx          # 主催者未ログイン時に /organizer/login へ
```

監査ログ閲覧は**運営スタッフ**の機能のため、organizer feature ではなく既存 admin feature 側に置く（`features/admin/pages/AuditLogPage.tsx`、Phase 2。[03-screens.md](./03-screens.md) 3.7）。

## 3. 既存への影響

| 対象 | 変更 | 内容 |
|------|------|------|
| `src/router/index.tsx` | 追記のみ | `/organizer/*` ルート群、`/join/:eventId` ルートを追加 |
| `features/auth/pages/RegisterPage` | 小変更 | URL の `eventId`（`/join/:eventId`）を受け取り、イベント名を表示 |
| `features/admin/pages/AdminLoginPage` | 小変更 | クエリ `?event=` を読み、event_id 事前充填＋イベント名表示 |
| 既存運営画面（ブース/カテゴリ/アンケート） | 小変更 | `role==='viewer'` 時に作成・編集・削除 UI を非表示/無効化（[03-screens.md](./03-screens.md) 3.6） |
| `authStore` / `isAdminUser` | 小変更 | `role` 値が `admin`→`manager`/`viewer` に変わるためセレクタを更新（[04-state-api.md](./04-state-api.md) 4.2） |
| 既存の参加者画面ロジック | なし | — |
| ビルド/デプロイ設定 | なし | — |

## 4. なぜ organizerStore を authStore と分けるか

既存 `authStore` は `user.event_id` を前提に全画面が参照している。主催者は `event_id` を持たないため、同じ store に載せると `useAuthStore((s)=>s.user?.event_id)` を使う既存コードが壊れる/誤動作する。主催者は**別 store（organizerStore）に完全分離**する。

なお既存 `authStore` 自体にも小変更がある：JWT の `role` 値が `admin`→`manager`/`viewer` に変わるため、`isAdminUser` 等のセレクタ更新が必要（[04-state-api.md](./04-state-api.md) 4.2）。これは構造変更ではなく値の対応。

## 5. フェーズ対応

- **Phase 1**：`/organizer/login`・`/organizer/events/new`（発行 URL カード＋スタッフ招待）・`/join/:eventId` 受け口・`/admin/login?event=` プリセット・既存運営画面の `viewer` UI 制御。これで「作成→URL→両画面が開く＋ロール付きスタッフ招待」が成立。
- **Phase 2**：イベント一覧・概要編集・削除、スタッフ一覧/ロール変更/削除、監査ログ閲覧画面。
