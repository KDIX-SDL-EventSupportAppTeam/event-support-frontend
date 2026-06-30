# 03. 画面仕様・コンポーネント分割

UI は既存どおり Bootstrap 5.3。フォーム検証はクライアント側でも行いつつ、最終的な真偽はサーバーの zod が担保する。

## 3.1 OrganizerLoginPage `/organizer/login`

- 入力：email / password
- 送信：`organizerApi.login()` → 成功で `organizerStore` にトークン保存 → `/organizer/events`（Phase 1 では `/organizer/events/new` へ直接でも可）
- 「主催者登録」は登録キーが要るためポータルから一般公開しない。プラットフォーム運営が別途発行する旨を文言で示す。

## 3.2 OrganizerEventCreatePage `/organizer/events/new`【中核・Phase 1】

2 ステップの単一ページ。

**ステップ A：概要入力（`EventForm` + 初期管理者入力）**

| フィールド | 必須 | 備考 |
|-----------|------|------|
| イベント名 `name` | ○ | |
| 開始日時 `date_start` | ○ | datetime-local |
| 終了日時 `date_end` | ○ | 開始より後（クライアント検証） |
| 会場 `venue` | × | |
| 初期管理者 email `initial_manager.email` | ○ | 最初の `manager` アカウント。追加スタッフは後から招待 |
| 初期管理者 パスワード `initial_manager.password` | ○ | 強度ヒント表示 |
| 初期管理者 表示名 `initial_manager.display_name` | × | |

- 送信：`organizerApi.createEvent(payload)` → 成功でステップ B へ遷移（同ページ内で表示切替）

**ステップ B：発行 URL カード（`IssuedUrlCard`）**
- レスポンスの `urls.participant` / `urls.admin` を表示
- 各 URL に**コピーボタン**（Clipboard API）
- QR コード表示は Phase 1 任意（既存 `html5-qrcode` は読み取り専用のため別ライブラリが必要）
- 「初期管理者アカウント：`<email>`」を明示。パスワードは**再表示しない**旨を注記（追加スタッフ招待時も同様）
- 「スタッフを追加する」ボタン → スタッフ招待フォームへ（ステップ C、Phase 1 でも提供）
- 「完了・一覧へ」導線

**ステップ C：スタッフ招待（Phase 1 でも提供・ステップ B の下に展開）**

URL 発行後に引き続きスタッフを追加できる。スタッフが増えても URL を再配布する必要はない（URL は変わらない）。

| フィールド | 必須 | 備考 |
|-----------|------|------|
| email | ○ | |
| パスワード | ○ | |
| 表示名 | × | |
| ロール | ○ | `manager`（管理者）/ `viewer`（閲覧者）のセレクト |

- 送信：`organizerApi.inviteStaff(eventId, payload)` → 成功でスタッフ一覧に追記表示
- 「管理者と閲覧者の違い」のツールチップ/注記を設ける（操作できる内容が違う旨を明記）
- **パスワードは送信成功後に表示しない**。招待者が直接スタッフへ伝える運用（メール送信は今回実装しない）。

## 3.3 EventForm（作成/編集共用コンポーネント）

- props：`initialValues`・`mode: 'create' | 'edit'`・`onSubmit`
- `edit` モードでは初期管理者・スタッフ招待欄を出さない（概要フォームのみ）
- 検証ロジック（日程逆転・必須）をここに集約し、作成/編集で重複させない

## 3.4 サインアップ画面のイベント表示（RegisterPage 改修）

`/join/:eventId` 経由でアクセスした場合、登録フォームの**冒頭に参加するイベント名を明示**する。

- `GET /api/v1/events/:eventId`（既存 or 新規）でイベント名・日程・会場を取得して表示
- `event_id` は URL から取得し、フォームに hidden として持たせる（参加者は意識しない）
- 例：「**○○展示会 2025** に参加登録します」

## 3.5 管理者ログイン画面のイベント表示（AdminLoginPage 小変更）

`?event=:eventId` が付いている場合、ログインフォームの上部にイベント名を表示する（管理者が「どのイベントにログインしようとしているか」を確認できるように）。

## 3.6 既存運営画面の権限対応（viewer ロール）

`viewer`（閲覧者）でログインした場合、既存の運営画面でデータの作成・編集・削除ボタンを**非表示または無効化**する。サーバー側で 403 を返すが、UI 上でも早期フィードバックを行う。

- JWT の `role` を `useAuthStore` から読み、`role === 'viewer'` の場合に分岐
- 非表示にする対象：ブース作成ボタン・編集ボタン・削除ボタン、カテゴリ作成/編集/削除、アンケート作成/編集/削除
- `viewer` でも参照できる：ダッシュボード・ブース一覧・参加者一覧・チェックイン状況・監査ログ

既存コンポーネント内の分岐追加のみ（ページそのものは共用）。

## 3.7 監査ログ画面（AuditLogPage、Phase 2）

`manager` / `viewer` 両方が閲覧できる。`/admin/audit-log` などに配置。

- `organizerApi.getAuditLogs(eventId, { page, action? })` で取得
- 表示項目：日時・操作者名・ロール・操作内容（action の日本語ラベル）・対象・詳細
- フィルタ：action 種別（全件 / ブース操作 / スタッフ操作 / アンケート操作）

## 3.8 OrganizerEventListPage / EditPage（Phase 2）

- 一覧：`organizerApi.listEvents()` をカード/テーブルで表示。各行に「スタッフ管理」「URL 再表示」「概要編集」「削除」
- 編集：`EventForm`（edit モード）→ 概要のみ。スタッフ管理は別セクション
- スタッフ管理：一覧表示＋ロール変更＋削除。「最後の manager を削除/降格禁止」はサーバーが 400 を返し、UI でもメッセージ表示
- 削除：確認モーダル必須。「配下のブース・参加者・チェックインも全て削除されます（不可逆）」と強く警告
