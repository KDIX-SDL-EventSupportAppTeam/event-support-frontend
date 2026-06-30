# 04. 状態管理と API クライアント

## 4.1 organizerStore（Zustand・authStore と完全分離）

```
state:
  token: string | null
  organizer: { id, email, display_name } | null
actions:
  setSession(token, organizer)   # ログイン成功時
  clear()                        # ログアウト / 401 時
selectors:
  isOrganizerLoggedIn = !!token
```

- 永続化：既存 authStore に倣い localStorage を使うが**キーを分ける**（例 `organizer_auth_token`）。`auth_token` と衝突させない。
- 既存 `authStore` には一切手を入れない。両者は別オリジンの関心事として並存する。
- `RequireOrganizer` ガードは `isOrganizerLoggedIn` を見て未ログインなら `/organizer/login` へ。

## 4.2 authStore の role 対応（既存 store への最小変更）

既存 `authStore` が保持する `user.role` の値が `'admin'` から `'manager'` / `'viewer'` に変わる。

- JWT の `role` フィールドが変わるだけなので、**`authStore` の構造自体は変えない**。
- `isAdminUser` などのセレクタが `role === 'admin'` を見ている場合は `role === 'manager' || role === 'viewer'` に更新する（運営スタッフ全般の判定）。
- `manager` 専用の判定が必要な箇所は `role === 'manager'` を使う。
- 実装者は `authStore.ts` と `isAdminUser` の現在の実装を確認してから変更すること。

## 4.3 organizerApi（Axios クライアント）

既存 `shared/api/v1*.ts` の作法（Axios インスタンス・Bearer 付与・エラー整形）に合わせる。**主催者トークンを送る専用インスタンス**を用意し、participant/admin 用クライアントと混線させない。

| 関数 | メソッド/パス | 認証ヘッダ |
|------|---------------|-----------|
| `register(key, body)` | POST `/organizer/auth/register` | `X-Organizer-Registration-Key` |
| `login(body)` | POST `/organizer/auth/login` | なし |
| `createEvent(body)` | POST `/organizer/events` | 主催者 Bearer |
| `listEvents()` | GET `/organizer/events` | 主催者 Bearer |
| `getEvent(id)` | GET `/organizer/events/:id` | 主催者 Bearer |
| `updateEvent(id, body)` | PATCH `/organizer/events/:id` | 主催者 Bearer |
| `deleteEvent(id)` | DELETE `/organizer/events/:id` | 主催者 Bearer |
| `inviteStaff(id, body)` | POST `/organizer/events/:id/staff` | 主催者 Bearer |
| `listStaff(id)` | GET `/organizer/events/:id/staff` | 主催者 Bearer |
| `updateStaffRole(id, userId, body)` | PATCH `/organizer/events/:id/staff/:userId` | 主催者 Bearer |
| `removeStaff(id, userId)` | DELETE `/organizer/events/:id/staff/:userId` | 主催者 Bearer |
| `getAuditLogs(id, params)` | GET `/admin/events/:id/audit-logs` | 運営 Bearer（主催者ではなく運営 JWT）|

> `getAuditLogs` は**運営スタッフが使う**機能のため、organizerApi ではなく `v1Admin.ts`（既存）に追加する方が適切。実装時に検討すること。

- 401 受信時は `organizerStore.clear()` → `/organizer/login` リダイレクト（インターセプタ）。

## 4.4 型定義

サーバーのレスポンス契約変更時はここと `server/.sdd/03-api.md` を同時更新する。

```ts
type StaffRole = 'manager' | 'viewer'

type IssuedUrls = { participant: string; admin: string }

type CreateEventResponse = {
  event: { id: string; name: string; date_start: string; date_end: string; venue?: string }
  initial_manager: { id: string; email: string }
  urls: IssuedUrls
}

type StaffMember = {
  id: string
  email: string
  display_name: string | null
  role: StaffRole
}

type AuditLog = {
  id: string
  actor_id: string
  actor_display_name: string | null
  actor_role: StaffRole
  action: string
  target_type: string
  target_id: string | null
  detail: Record<string, unknown> | null
  created_at: string
}
```

## 4.5 環境変数

フロント追加は**原則不要**。発行 URL はサーバーが `FRONTEND_BASE_URL` を使って絶対 URL で返すため、フロントは受け取って表示するだけ。

- 例外：サーバーが相対パスのみ返す設計に倒す場合は、フロントで `window.location.origin` を前置して絶対化する。どちらにするかは `server/.sdd/03-api.md` 3.6 と整合させる（現案は**サーバーが絶対 URL を返す**）。
