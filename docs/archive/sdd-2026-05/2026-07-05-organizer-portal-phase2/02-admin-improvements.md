# 02. 運営画面改善

いずれもサーバー変更不要（監査ログ画面は既存 API、イベント名表示のみサーバー P2-3 に依存）。
A〜C が本命、D〜E は小粒。項目単位で PR を分割してよい。

---

## A. viewer ガードの穴埋めと判定の統一 【優先】

### 現状

viewer ロールの UI 制御はブース管理・カテゴリ管理・アンケート管理の 3 画面で
実装済み（コミット `cb96150`、各ページにインラインの
`canEdit = userRole === 'manager' || userRole === 'admin'`）。
サーバー側の 403 も PR #39 で実装済み。ただし以下の画面にガードがなく、
viewer に危険な操作 UI が見えてしまう（押すと 403 エラー）。

| 画面 | viewer に見えてしまう操作 |
|------|--------------------------|
| ParticipantsPage | 参加者の削除ボタン |
| EventInfoPanel（メニュー上部） | イベント名・会場のインライン編集 |
| EventDataClearPanel | **イベント全データ削除** |
| SampleDataPage | サンプルデータ生成・削除 |

### 修正仕様

1. **判定を `isManagerUser`（`shared/auth/authStore` の既存ヘルパー）に統一する。**
   3 画面のインライン `canEdit` 定義を
   `const canEdit = isManagerUser(useAuthStore((s) => s.user))` に置き換える
   （ヘルパーは manager + 旧 admin を真とする。挙動は現行と同一）
2. 上表 4 箇所に同じガードを追加する:
   - ParticipantsPage: 削除ボタンを非表示
   - EventInfoPanel: viewer 時は `<input>` をテキスト表示に置き換える（readonly ではなく非編集の見た目に）
   - EventDataClearPanel / SampleDataPanel: パネル自体を非表示にし、
     代わりに「この操作には管理者権限が必要です」の 1 行を表示
   - SampleDataPage への**サイドバー導線**（FULL_PAGE_NAV）も viewer 時は非表示にする
3. 受け入れ条件: viewer でログインして全運営ページを巡回し、
   作成・編集・削除・生成系の操作 UI が一切表示されないこと。
   manager では従来どおりすべて表示されること

---

## B. 監査ログ閲覧画面（AuditLogPage・新設）【優先】

サーバー API（`GET /admin/events/:event_id/audit-logs`、ページネーション対応）は
PR #39 で実装済み。**閲覧 UI が存在しない**ため新設する。

- ルート: `/admin/audit-logs`（`RequireAdmin`。manager / viewer とも閲覧可）
- サイドバー FULL_PAGE_NAV に「操作履歴」（アイコン `bi-clock-history`）を追加
- API クライアント: `shared/api/v1Admin.ts` に `fetchAdminAuditLogs(eventId, { page, limit })` を追加

**表示（テーブル）:**

| 列 | 内容 |
|----|------|
| 日時 | `created_at` を `toLocaleString('ja-JP')` |
| 操作者 | `actor_display_name`（null なら `actor_id` の先頭 8 桁）+ ロールバッジ |
| 操作 | action の日本語ラベル（下表） |
| 対象 | `target_type` + `detail` の要約（例: ブース名 / email） |

**action ラベルマップ**（`features/admin/lib/auditActionLabels.ts` に定数として置く）:

| action | ラベル |
|--------|--------|
| `booth.create` / `booth.update` / `booth.delete` | ブース作成 / 更新 / 削除 |
| `category.create` / `category.update` / `category.delete` | カテゴリ作成 / 更新 / 削除 |
| `survey_question.create` / `survey_question.update` / `survey_question.delete` | 設問作成 / 更新 / 削除 |
| `staff.invite` / `staff.role_change` / `staff.remove` | スタッフ招待 / ロール変更 / 削除 |
| （未知の action） | 生文字列をそのまま表示（将来の action 追加で壊れないように） |

- ページネーション: 前へ / 次へ + 「n / N ページ」（API の `pagination` を使用）。limit 50 固定
- フィルタ: action 種別（すべて / ブース / カテゴリ / 設問 / スタッフ）。
  API に filter パラメータはないため**クライアントサイドで現在ページ内を絞る**
  （サーバーフィルタが必要になったら API 拡張を別途提案）
- 0 件時: 「操作履歴はまだありません」

---

## C. 「どのイベントにいるか」の常時表示

### C-1. サイドバーにイベント名＋ステータス

現状 `AdminSidebar` が表示しているのは**ログイン中スタッフの表示名**
（変数名は `eventName` だが中身は `user.display_name`）。イベント名はメニューページの
EventInfoPanel 以外に出ない。

- サイドバー上部に **イベント名**（`fetchAdminEvent` の結果。取得は AdminShell 側で 1 回）と
  **開催ステータスバッジ**（`shared/lib/eventStatus.ts`。01 の 1.3 で共用化済み）を表示する
- スタッフ表示名はその下に小さく「ログイン中: ◯◯」として残す（誤解を招く現状の表示を是正）
- 変数名 `eventName` の誤命名も修正する

### C-2. ログイン画面・参加登録画面のイベント名表示【サーバー P2-3 依存】

公開イベント情報 API（`GET /events/:event_id/public`）を使い、UUID の生表示を解消する。

- `shared/api/` に `fetchPublicEvent(eventId)` を追加（**認証ヘッダー不要**。
  未ログインで呼ぶため `apiClient` のインターセプタと干渉しないことを確認）
- AdminLoginPage: `?event=` があるとき「イベント: <UUID>」→「イベント: **<イベント名>**（日程）」。
  取得失敗時は現状どおり UUID を表示（导線を止めない）
- JoinPage: 「eventId をそのまま表示」している `eventLabel` を、イベント名＋日程＋会場の
  バナー表示に差し替える。取得失敗時は現状どおり ID 表示

---

## D. EventInfoPanel の編集 UX 修正

1. **エラー処理のバグ修正**: 保存失敗で `error` state がセットされるとパネル全体が
   エラー表示に置き換わり、**以後編集 UI が戻らない**（成功時も `setError(null)` していない）。
   - 初回読み込みエラーのみ全面エラー表示とし、保存エラーはパネル内のインライン
     アラート（閉じる可）にする。`saveField` 成功時に error をクリアする
2. **明示的な編集モード**: blur 即保存のインライン編集は誤操作に気づきにくい。
   鉛筆アイコン → 入力欄＋「保存 / キャンセル」ボタンの明示的編集に変更する
   （A. の viewer ガードとセットで実装するのが効率的）

---

## E. 小粒の改善

| ID | 内容 |
|----|------|
| E-1 | **参加者削除の警告強化**（ParticipantsPage）: `confirm` 文言を「この参加者のチェックイン・評価・アンケート回答もすべて削除されます。元に戻せません。」に変更 |
| E-2 | **参加者一覧の検索**: 表示名 / email の部分一致フィルタ入力欄を追加（クライアントサイド。並び替えは現状維持） |
| E-3 | **rating:new のデバウンス**（DashboardPage）: `rating:new` 受信ごとに全再取得している処理を、5 秒間の trailing デバウンスにまとめる（評価ラッシュ時のリクエスト連発防止） |
| E-4 | **/admin/menu と /admin/dashboard の使い分け明示**: 統合はしない。サイドバーのラベルを「メニュー」→「分析ボード」、「ダッシュボード」→「リアルタイム」に変更し、役割（分析ウィンドウ群 vs リアルタイム統計）を名前で区別できるようにする |

## 将来（本フェーズ非対象・記録のみ）

- **スタッフ本人のパスワード変更**: 主催者が初期パスワードを決める現行運用では、
  スタッフが自分でパスワードを変えられない（`/forgot-password` はプレースホルダー）。
  サーバーに `PATCH /auth/password`（現パスワード確認つき）の新設が必要。別フェーズで提案する
- 監査ログのサーバーサイドフィルタ・CSV エクスポート

## 受け入れ条件（02 全体）

- A: viewer で全運営画面に操作系 UI が出ない／`grep -rn "canEdit"` の定義箇所が
  `isManagerUser` 経由に統一されている
- B: manager / viewer とも操作履歴ページで直近の CRUD 操作が日本語ラベルで確認できる
- C: 全運営ページのサイドバーにイベント名とステータスが表示される
- D: 保存失敗 → 再編集 → 保存成功、の一連が画面遷移なしで行える
- `npm run build`・`npm run lint`・`cd tests && npm test` が通る
