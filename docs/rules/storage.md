# ブラウザストレージの扱い

localStorage / sessionStorage のキーは **`src/shared/config/storageKeys.ts` に一元化**する。
**キーの文字列リテラルをほかのファイルに書かない。**
`grep -rn "localStorage\.\|sessionStorage\." src` で、`storageKeys.ts` 以外にリテラルのキーが無いことを確認できる状態を保つ。

## 命名規約

| 種別 | 形 | 例 |
|---|---|---|
| 版付き（形が変わり得る・消えても再ログインで復旧できる） | `esa:v<版>:<scope>:<name>` | `esa:v1:participant:token` |
| 版なし（真偽値・ID。版を上げても残す） | `esa:<name>` / `esa:event:<eventId>:user:<userId>:<name>` | `esa:last-event-id` |
| sessionStorage（タブ単位の一時状態） | `esa:session:<name>` | `esa:session:new-lines` |

- すべて `esa:` で始める（所有権の判定に使う）
- 既読フラグのような**イベント × ユーザー単位の値は `eventScopedKey()`** で作る。
  `purgeEventScopedKeys(eventId)` でイベント単位に掃除できる
- 書き込み・読み取り・削除は**すべて `try/catch` で包む**（プライベートブラウジング等で例外になる）。
  ストレージの失敗で機能を止めない

## `STORAGE_VERSION` を上げる基準

版を上げるとキー名が変わり、**古い形のデータは読まれなくなる**（起動時の `purgeOutdatedStorage()` が掃除する）。
同時に **全参加者・全運営が再ログインになる。**

上げるとき（**どれか1つでも該当**）:

- `participant:user` / `organizer:user` に保存する JSON の**形を変えた**（フィールドの追加・削除・改名）
- 保存している値の**意味を変えた**（型は同じで enum の意味が変わる等。読み取り時のバリデーションでは捕まらない）
- サーバーの認証・JWT の形式を変えた（古いトークンを持ち続けると 401 のループになる）

上げないとき:

- 版なしキー（`last-event-id`・既読フラグ）の追加・変更。これらは版に乗せない設計
- 文言・見た目の変更

**イベント当日・直前（前日〜終了）には上げない。** 当日に全員がログアウトされる。
上げる PR には「再ログインが発生する」ことと、デプロイ日を運営と合わせたことを書く。

## 掃除

- `src/main.tsx` の**最初の import**で `purgeStorageOnBoot` が走る。
  `authStore` は評価時に localStorage を読むため、**これより後ろに移さない**
- 規約導入前の旧キー（`token` / `auth_user` / `last_event_id` ほか）は一度だけ名指しで掃除する。
  新キーへの移行はしない（移行コードが負債になる。再ログインで足りる）
- JWT の期限切れ判定・モックセッションの破棄は `authStore.readInitialSession` が行う。**消さない**
