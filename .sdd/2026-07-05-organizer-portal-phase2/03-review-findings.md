# 03. 実装レビュー指摘（2026-07-06）

コミット `08655f0`（integration/2026-07-organizer-portal-phase2）のレビュー結果。
仕様適合・テスト（33件）・ビルド・lint はすべて確認済み。以下は追加修正のみ。

---

## FE-R1. イベント名を空で保存すると 422 の汎用エラーになる 【中】

**現象**
`EventInfoPanel` の編集モードでイベント名を空にして「保存」すると、
`updateAdminEvent(eventId, { name: null })` が送信される
（`saveField` の `{ [field]: draft || null }`）。サーバーの `patchEventBody` は
`name: z.string().min(1)`（null 不可）のため 422「入力が不正です」が返り、
ユーザーには原因の分からない汎用メッセージが表示される。

**修正仕様**
- `saveField('name')` で `draft.trim()` が空の場合、送信せずに
  `saveError` へ「イベント名は必須です」を表示する
- venue は nullable（空 → null で「会場未設定」に戻す）が正しい挙動のため変更しない
- 送信値は `draft.trim()` を使う（前後空白だけの名前を防ぐ）

**受け入れ条件**
- 空文字・空白のみで保存 → API を呼ばずにメッセージ表示、編集モードは維持
- 通常の名前変更・会場のクリアは従来どおり成功する

---

## FE-R2. サイドバー用イベント情報の重複フェッチ 【低】

**現象**
`AdminShell` がマウント（＝運営ページ遷移）のたびに `fetchAdminEvent` を呼ぶ。
メニューページでは `EventInfoPanel` も同じ API を呼ぶため、1 画面で 2 回になる。

**修正仕様**
- イベント名・日程を `adminMenuStore`（既存の zustand store）にキャッシュし、
  `eventId` が同じ間は再フェッチしない
- `EventInfoPanel` が保存で名前を変更したときはキャッシュも更新する
  （サイドバーの表示名が古いままにならないように）
- 開催ステータスは日時からの導出のため、キャッシュした日時から都度計算する

**受け入れ条件**
- 運営ページを行き来しても `/admin/events/:id`（GET）が初回の 1 回しか飛ばない
- イベント名変更後、サイドバーの名前が即座に追従する

---

## 対応不要と判断した点（記録）

- StaffList の「最後の管理者」UI ガード: サーバーが `admin` → `manager` に正規化して
  返すため、クライアントの `role === 'manager'` カウントで正しく動作する
- ロール変更セレクトの確認キャンセル: controlled component のため表示値は自動で戻る
- `publicEvent.ts` を独立 axios インスタンスにした判断: 仕様（02 C-2）の意図どおり
