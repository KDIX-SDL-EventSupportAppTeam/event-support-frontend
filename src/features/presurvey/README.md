# presurvey — イベント前事前アンケート

参加者に配布した URL から回答してもらう、イベント前の事前アンケート。
現状は**画面遷移のみ**を実装し、データは localStorage のモックに保存する。

## 画面遷移

```
/pre-survey/:eventId                 入口（参加者に配布する URL）
  ├─ 初回          → /signup  サインアップ → /form → /thanks
  ├─ 2 回目以降    → /signin  サインイン
  │                    ├─ 回答済み  → /thanks（アプリへの遷移ボタン）
  │                    └─ 未回答    → /form → /thanks
  └─ 同端末でサインイン済み → 回答状況に応じて /form か /thanks へ自動遷移
```

`/thanks` の「アプリに移動する」は、アプリ本体にログイン済みなら `/home`、
未ログインなら `/join/:eventId`（参加登録）へ遷移する。

## ディレクトリ

| パス | 責務 |
|------|------|
| `config/questions.ts` | 質問定義の正本。属性の追加・変更はここだけ |
| `types/presurvey.ts` | 回答・回答者・送信ペイロードの型 |
| `api/presurveyApi.ts` | データアクセス層。**サーバー接続時はこの 4 関数の中身だけ差し替える** |
| `api/presurveyLocalStore.ts` | モック永続化（localStorage）。サーバー接続後は削除可 |
| `store/presurveySessionStore.ts` | 回答者セッション（アプリ本体の認証とは独立） |
| `components/` | 共通レイアウトと質問 1 件分の入力欄 |
| `pages/` | 各画面。API は `api/presurveyApi.ts` 経由でのみ呼ぶ |

## サーバー・DB 接続時の作業

`api/presurveyApi.ts` の以下 4 関数を実 API 呼び出しに置き換える（想定エンドポイントは同ファイルの JSDoc）。

- `fetchPreSurveyQuestions` / `signUpPreSurvey` / `signInPreSurvey` / `submitPreSurveyAnswers`

回答値はラフ集合分析の決定表にそのまま載せられるよう、選択肢の `value`（離散コード）で保持している。
自由記述（`free_comment`）は分析対象外。
