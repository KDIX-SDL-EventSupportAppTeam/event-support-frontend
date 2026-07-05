# 01. 主催者ポータル（一覧・詳細・スタッフ管理）

UI は既存どおり Bootstrap 5.3。API 呼び出しは `features/organizer/api/organizerApi.ts` に追加する
（画面コンポーネントに axios を直書きしない）。

---

## 1.1 ルーティング変更

| パス | 画面 | 変更 |
|------|------|------|
| `/organizer/events` | OrganizerEventListPage | **新設**。ログイン後の着地先 |
| `/organizer/events/new` | OrganizerEventCreatePage | 既存。完了画面に「一覧へ戻る」導線を追加 |
| `/organizer/events/:eventId` | OrganizerEventDetailPage | **新設** |
| `/organizer/login` | OrganizerLoginPage | ログイン成功後・ログイン済みリダイレクトの遷移先を `/organizer/events` に変更 |

- 新設 2 ルートは `RequireOrganizer` でガードする（既存パターン）
- `router/index.tsx` への追記のみ。既存ルートの変更はログイン遷移先の 2 箇所

## 1.2 OrganizerShell（共通レイアウト・新設）

現状の主催者画面には**ログアウト導線がない**。`features/organizer/components/OrganizerShell.tsx` を
新設し、一覧・作成・詳細の 3 ページを包む。

- 上部ヘッダー: 「主催者ポータル」タイトル（`/organizer/events` へのリンク）／
  主催者の表示名（`organizerStore.organizer.display_name`）／
  ナビ「イベント一覧」「新規作成」／「ログアウト」ボタン
- ログアウト: `organizerStore.clear()` → `/organizer/login` へ遷移
- 参加者/運営側の `AdminShell` は import しない（feature 間 import 禁止。構造の類似は許容）

## 1.3 開催ステータスの共用ユーティリティ

`features/admin/components/EventInfoPanel.tsx` 内の `eventStatus()` / `formatRemaining()` を
**`src/shared/lib/eventStatus.ts` へ移動**し、admin / organizer 両方から import する。

```ts
type EventStatus = { key: 'upcoming' | 'ongoing' | 'ended'; label: string; className: string }
eventStatus(dateStartIso: string, dateEndIso: string, now?: number): EventStatus
formatRemaining(dateStartIso: string, dateEndIso: string, now?: number): string | null
```

- ラベル・配色は既存実装を維持: 準備中 `bg-secondary` / 開催中 `bg-success` / 終了 `bg-dark`
- シグネチャは `AdminEvent` 型依存をやめ、ISO 文字列 2 つを取る形に一般化する
  （organizer 側のイベント型からも呼べるように）
- `now` 引数はテスト用（既定 `Date.now()`）。`tests/unit/event-status.test.ts` を追加
  （境界: 開始直前・開始時刻ちょうど・終了時刻ちょうど・終了後）

## 1.4 OrganizerEventListPage `/organizer/events`【P2-1 中核】

`organizerApi.listEvents()`（`GET /organizer/events`）で取得し、カードのグリッドで表示する。

**各イベントカード:**

- イベント名（クリックで詳細へ）
- **開催ステータスバッジ**（1.3 のユーティリティ）+ 開催中なら「終了まで◯時間◯分」
- 日程（`toLocaleString('ja-JP')`）・会場
- 統計サマリー: 参加者 / ブース / チェックイン数（レスポンスの `stats`）
- アクション: 「詳細」ボタン、「参加者 URL をコピー」「運営 URL をコピー」
  （Clipboard API。コピー成功のトースト/一時表示は `IssuedUrlCard` の既存挙動に合わせる）

**一覧の補助機能:**

- ステータスフィルタ: 「すべて / 開催中 / 準備中 / 終了」のセグメントボタン。
  既定は「すべて」。フィルタはクライアントサイドで行う（導出値のため）
- 並び順: サーバー返却順（`date_start DESC`）をそのまま使う
- 0 件時: 空状態イラスト＋「最初のイベントを作成する」ボタン（`/organizer/events/new` へ）
- 読み込み中: スケルトンまたはスピナー。エラー時: `formatClientError` でアラート表示＋再試行ボタン

## 1.5 OrganizerEventDetailPage `/organizer/events/:eventId`【P2-2 中核】

`organizerApi.getEvent(eventId)`（`GET /organizer/events/:event_id`）で取得。
403 の場合は「このイベントにはアクセスできません」を表示し一覧へ戻す。

**セクション構成（1 ページ縦積み）:**

1. **概要**: イベント名・ステータスバッジ・日程・会場・作成日・統計サマリー。
   **閲覧のみ**（編集フォームは置かない。「イベント情報の編集は運営画面から行えます」と注記し、
   運営 URL を案内する）
2. **発行 URL**: 既存 `IssuedUrlCard` を再利用（レスポンスの `urls` を渡す）。
   これにより「URL は作成直後しか見られない」問題が解消する
3. **スタッフ管理**（1.6）

## 1.6 スタッフ管理セクション（StaffList 新設 + StaffInviteForm 再利用）

`features/organizer/components/StaffList.tsx` を新設する。

**一覧表示** — `organizerApi.listStaff(eventId)`:

| 列 | 内容 |
|----|------|
| 表示名 / email | display_name（空なら email のみ） |
| ロール | バッジ: manager「管理者」/ viewer「閲覧者」 |
| 追加日 | created_at |
| 操作 | ロール変更セレクト・削除ボタン |

**ロール変更** — セレクト変更時に確認ダイアログ →
`organizerApi.updateStaffRole(eventId, userId, role)`。
成功でその行を更新。409（最後の管理者）はサーバーのメッセージをそのまま行内に表示する。

**削除** — 確認ダイアログ（「このスタッフはログインできなくなります」）→
`organizerApi.removeStaff(eventId, userId)`。409 は同上。

**招待** — 既存 `StaffInviteForm` をセクション下部に設置（トグル開閉）。
招待成功時は一覧を再取得する。**招待フォームのパスワードは成功後に再表示しない**
（Phase 1 の方針を踏襲。主催者が本人に直接伝える運用）。

**UI 上のガード（サーバーと二重）:**
manager が 1 人だけのとき、その行のロール変更セレクトと削除ボタンを無効化し、
ツールチップで「最後の管理者は変更・削除できません」と表示する。

## 1.7 organizerApi への追加関数

```ts
listEvents(): Promise<OrganizerEvent[]>                 // GET /organizer/events
getEvent(eventId): Promise<OrganizerEvent>              // GET /organizer/events/:id
listStaff(eventId): Promise<Staff[]>                    // GET /organizer/events/:id/staff
updateStaffRole(eventId, userId, role): Promise<Staff>  // PATCH .../staff/:user_id
removeStaff(eventId, userId): Promise<void>             // DELETE .../staff/:user_id
```

型（`OrganizerEvent` = id/name/date_start/date_end/venue/created_at/stats/urls、
`Staff` = id/email/display_name/role/created_at）はサーバー SDD 01-api.md の
レスポンス契約と 1:1 で定義する。

## 1.8 organizerStore の起動時失効チェック

現状、主催者トークン（30 日有効）はローカルで失効判定されず、期限切れ後に
API の 401 を踏んでから `/organizer/login` に飛ばされる。

- ストア初期化時（セッション復元時）に `shared/auth` の `isJwtExpired` を流用して判定し、
  期限切れならセッションを破棄して未ログイン状態で開始する
  （participant 側 `readInitialSession` と同じ方針）

## 1.9 受け入れ条件（ポータル全体）

- ログイン → イベント一覧が表示され、各イベントに正しいステータスバッジが付く
- 一覧 → 詳細 → 発行 URL のコピー、スタッフの一覧・招待・ロール変更・削除が一連で行える
- manager が 1 人のイベントで、その manager の降格・削除が UI で無効化され、
  API 直叩きでも 409 になる（サーバー側と併せて確認）
- `/organizer/*` の全ページにログアウト導線がある
- 期限切れトークンで開いた場合、エラー表示なしにログイン画面から始まる
- `grep`: organizer feature から `@/features/admin/` への import が 0 件
