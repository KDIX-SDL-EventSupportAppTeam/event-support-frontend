# presurvey — イベント前事前アンケート

参加者に配布した URL から回答してもらう、イベント前の事前アンケート。
サーバー接続済み。API 契約の正本は `event-support-server/docs/specs/pre-survey/`
（UI 側の仕様は `docs/specs/pre-survey/README.md`）。

## 画面遷移

```
/pre-survey/:eventId                 入口（参加者に配布する URL）
  ├─ 初回          → /signup  サインアップ（useAuth().register） → /form → /thanks
  ├─ 2 回目以降    → /signin  サインイン（useAuth().login） → /form → /thanks
  └─ 同端末で認証済み（authStore.token かつ user.event_id が一致） → /form へ自動遷移
```

`/thanks` の「アプリに移動する」は、アプリ公開ゲート（`shared/hooks/useAppAccess`）の
実効開放状態 `is_open` に従って有効・無効を切り替える。無効時は開放予定時刻と
残り時間を表示し、ページ再読み込みなしに開放へ追随する（30 秒ポーリング + サーバー
時刻補正のローカルカウントダウン）。ボタンの遷移先自体は、アプリ本体にログイン済みなら
`/home`、未ログインなら `/join/:eventId`（参加登録）。

## ディレクトリ

| パス | 責務 |
|------|------|
| `types/presurvey.ts` | 回答・設問・送信結果の型（サーバーレスポンス形状に合わせてある） |
| `api/presurveyApi.ts` | データアクセス層。`GET /pre-survey/questions` と `POST /survey/answers` を呼ぶ |
| `components/` | 共通レイアウトと質問 1 件分の入力欄。選択肢は常にサーバーの `options` をそのまま描画する |
| `pages/` | 各画面。サインアップ／サインインは `features/auth/hooks/useAuth` を使う |

## サーバー接続の要点

- 設問は `GET /events/:event_id/pre-survey/questions`（未ログインでも取得可）から配信される。
  フロントに設問をハードコードしない（P-11）。関心分野の選択肢はサーバーが `categories` から
  動的生成する（P-10）。
- 回答は `POST /events/:event_id/survey/answers`（Bearer 必須）。締切後は 409
  （`code: 'PRE_SURVEY_CLOSED'`）が返り、`ApiError` として扱う。
- 回答値は `question_key` をキーに保持する（`id` は UUID で環境ごとに変わるため使わない）。
- サインアップ／サインインはアプリ本体の認証（`features/auth` / `shared/auth/authStore`）を
  そのまま使う。事前アンケート専用のセッションストアは持たない。
- アプリ公開ゲート（`app_access`）は feature を跨いで使うため `shared/api/appAccess.ts` と
  `shared/hooks/useAppAccess.ts` に置いている。
