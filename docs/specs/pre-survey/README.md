---
状態: 確定
最終更新: 2026-08-28
---

# 事前アンケートとアプリ公開ゲート（UI 仕様）

**API 契約・DB スキーマの正本は `event-support-server/docs/specs/pre-survey/`。**
ここには画面の仕様だけを書く。

## なぜ最優先なのか

**ビンゴの事前推薦マスの前提である。** 参加者が来場した瞬間に
「あなたにはこのブースがおすすめです」と表示する材料が、事前アンケートの回答しかない。

## 現状

**実装済み。** サーバー連携・アプリ公開ゲートに加え、参加者の入口を配布 URL 1 本に統合した
（[ADR 0004](../../decisions/adrs/0004-single-entry-url-state-machine.md)）。
実装は `src/features/entry/`（旧 `features/presurvey/` は廃止）。

## 画面遷移

配布 URL `/e/:eventId` 1 本。URL は段階を持たず、`GET /me/state` の戻り値が表示を決める。

```
/e/:eventId
  ├ token 無し                  → サインイン / サインアップ
  ├ email_verified: false       → メール確認待ち
  ├ survey_answered: false      → アンケート回答
  ├ app_access.is_open: false   → 開放待ち（30 秒ポーリング）
  ├ onboarding_completed: false → オンボーディング
  └ すべて済み                   → /home（出展者は /exhibitor）
```

旧 URL（`/pre-survey/*` ・ `/login` ・ `/register` ・ `/join/:eventId` ・ `/onboarding`）は
リダイレクトとして残す。配布済みの URL を 404 にしない。

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
- [ ] `/thanks` の遷移先が、ゲートの `is_open` に従う（現状はログイン状態だけで分岐している）
