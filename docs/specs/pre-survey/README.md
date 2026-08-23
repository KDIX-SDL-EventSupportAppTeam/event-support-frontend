---
状態: 草案
最終更新: 2026-08-24
---

# 事前アンケートとアプリ公開ゲート（UI 仕様）

**API 契約・DB スキーマの正本は `event-support-server/docs/specs/pre-survey/`。**
ここには画面の仕様だけを書く。

## なぜ最優先なのか

**ビンゴの事前推薦マスの前提である。** 参加者が来場した瞬間に
「あなたにはこのブースがおすすめです」と表示する材料が、事前アンケートの回答しかない。

## 現状

`src/features/presurvey/` に **localStorage ベースのモック実装**がある
（`feat/pre-survey-and-app-access-gate` ブランチ）。5画面の遷移は確認済み。
**サーバー連携が未実装。**

## 画面遷移

```
配布URL /pre-survey/:eventId
   ├ 初回      → /signup  アカウント作成 → /form 回答 → /thanks
   └ 2回目以降 → /signin
                   ├ 回答済み → /thanks
                   └ 未回答   → /form → /thanks

/thanks
   └ [アプリに移動する]
        ├ is_open === true   → 有効。押すと /home へ
        └ is_open === false  → 無効 + 「開放予定 10/16 09:30（あと 3 時間 12 分）」
```

## モックからの差し替え

| 対象 | 対応 |
|---|---|
| `api/presurveyLocalStore.ts` | **削除** |
| `api/presurveyApi.ts` | 中身を実 API 呼び出しに置き換える |
| `store/presurveySessionStore.ts` | **削除。** 認証は `shared/auth/authStore` に統合する |
| `config/questions.ts` | **削除。** 設問はサーバー配信に完全移行する（サーバー側 P-11） |
| `pages/*` | 遷移構造は維持。サインアップ／サインインを `features/auth/hooks/useAuth` 経由に変更 |
| `types/presurvey.ts` | サーバーレスポンスに合わせて調整（`question_key` の追加など） |

| `presurveyApi.ts` の関数 | 置き換え先 |
|---|---|
| `fetchPreSurveyQuestions` | `GET /events/:event_id/pre-survey/questions` |
| `signUpPreSurvey` | `useAuth().register` |
| `signInPreSurvey` | `useAuth().login` |
| `submitPreSurveyAnswers` | `POST /events/:event_id/survey/answers` |

## アプリ公開ゲート

feature を越えて使うため `shared/` に置く。

| ファイル | 責務 |
|---|---|
| `src/shared/api/appAccess.ts` | `fetchAppAccess(eventId)` — 公開 GET のラッパー。型 `AppAccess` を export |
| `src/shared/hooks/useAppAccess.ts` | **30秒ポーリング** + `server_time` との差分でローカル補正した残り時間 |

**WebSocket は使わない。** 未ログイン〜ログイン直後の画面でも動く必要があり、
socket は JWT 必須で `/thanks` に向かない（サーバー側 P-9）。

**残り時間の計算に端末の時計をそのまま使わない。**
`server_time` との差分で補正する（サーバー側 P-4）。

## 関心分野の設問

選択肢は**サーバーが `categories` から生成して返す**（サーバー側 P-10）。
フロントは受け取った `options` をそのまま描画するだけ。**分野名をハードコードしない。**

## 合格基準

- [ ] 未ログインで設問を表示できる
- [ ] 回答送信後 `/thanks` へ遷移する
- [ ] `is_open: false` のときボタンが無効で、カウントダウンが表示される
- [ ] `is_open` が true に変わると、ページを再読み込みせずにボタンが有効になる
- [ ] 端末の時計をずらしても、カウントダウンがサーバー時刻に追随する
- [ ] 締切後の送信で 409 を受け、その旨が表示される
- [ ] 必須設問が未回答だと送信できない
- [ ] 関心分野の選択肢がサーバーから来た値である（ハードコードされていない）
- [ ] `presurveyLocalStore` / `presurveySessionStore` / `config/questions.ts` が存在しない
