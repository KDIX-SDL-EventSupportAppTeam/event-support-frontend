# 01. コード修正仕様

---

## F-1. 本番ビルドの参加登録画面に開発用資格情報がプリフィルされる 【最優先】

> **対応状況（2026-07-05 更新）**: PR #38（`fix/tk-verification-findings`）が **JoinPage のみ**
> 修正仕様 1 と同一の形で対応済み。**RegisterPage・修正仕様 2（resolve 関数の二重ガード）・
> 単体テストは PR #38 に含まれない**ため、本項の残スコープはその 3 点。
> なおローカル作業ツリーに全スコープを実装した未コミット変更が存在する（下記「PR #38 との調整」参照）。

**現象**
本番ビルドの `/join/:eventId`（QR からの参加者入口）と `/register` で、
メール欄に `dev@example.com`、パスワード欄に `password123` が事前入力された状態で表示される。

**原因**
- `src/features/auth/pages/JoinPage/JoinPage.tsx` と
  `src/features/auth/pages/RegisterPage/RegisterPage.tsx` が
  `resolveDevLoginEmail()` / `resolveDevLoginPassword()` を **DEV ガードなし**で
  `useState` の初期値にしている
- `src/features/auth/mocks/devDummyCredentials.ts` の resolve 関数は、
  本番ビルド（`import.meta.env.DEV === false`）では `DEV_API_EMAIL` / `DEV_API_PASSWORD`
  （= サーバー `db:seed` のシード資格情報）へフォールバックする
- `LoginPage.tsx` のみ `import.meta.env.DEV ? resolveDevLoginEmail() : ''` とガード済みで、
  他 2 画面が取り残された

**影響**
- 本番参加者に開発用シードの実在アカウント情報が露出する（シードを本番 DB に
  投入していた場合はそのままログイン可能）
- AGENTS.md「本番ビルドではモックをバンドルしない」の宣言とも矛盾する

**修正仕様**
1. JoinPage / RegisterPage の初期値を LoginPage と同じ形式に統一する:
   `useState(() => (import.meta.env.DEV ? resolveDevLoginEmail() : ''))`
   （password・displayName も同様。displayName の本番初期値は空文字）
2. 保険として `devDummyCredentials.ts` の resolve 関数自体も
   `import.meta.env.DEV === false` のとき常に空文字を返すよう二重化する
   （呼び出し側のガード漏れが再発しても本番に値が出ない構造にする）

**受け入れ条件**
- `npm run build` した成果物で `/join/:eventId`・`/register`・`/login` の全入力欄が空
- `npm run dev`（モック・実 API 両モード）では従来どおり開発用初期値が入る
- `tests/unit/` に「本番相当（DEV=false）で resolve 関数が空文字を返す」テストを追加する

---

## F-2. socket 接続の参照カウントが接続確立前の再入で壊れる 【中】

**現象**
`src/shared/api/socket.ts` — `connectSocket()` は `socket?.connected` が true の場合のみ
参照カウントを加算する。接続確立中（`connected === false`）に別コンポーネントが
`connectSocket` を呼ぶと、既存ソケットを `disconnect()` して作り直し、
`socketRefCount = 1` にリセットする。先に接続していた利用者の参照が無効になり、
`disconnectSocket()` の対応も崩れる（ダッシュボード系ウィンドウの多重マウントで発生し得る）。

**修正仕様**
- 「同一トークンでソケットインスタンスが存在する」場合は、接続状態を問わず
  参照カウントを加算して同じインスタンスを返す（socket.io は自動再接続するため、
  connecting 中のインスタンスを使い回してよい）
- 作り直しは「トークンが異なる」場合のみとする

**受け入れ条件**
- 同一トークンで `connectSocket` を 2 回呼び → `disconnectSocket` を 1 回呼んだ時点では
  切断されず、2 回目で切断される
- トークン変更時は旧接続が切断され新規接続に置き換わる
