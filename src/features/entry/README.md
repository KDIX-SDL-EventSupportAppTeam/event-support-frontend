# entry — 参加者の単一入口

参加者が触る URL は `/e/:eventId`（配布リンク）1 本だけ。
**URL は段階を持たず、サーバーが持つ。** 決定の経緯は
[ADR 0004](../../../docs/decisions/adrs/0004-single-entry-url-state-machine.md)。

## 仕組み

配布リンクを踏むたびに `GET /events/:event_id/me/state` を 1 回呼び、
その戻り値だけで描く段階を決める。どこで中断しても、同じ URL を踏み直せば続きから再開する。

```
/e/:eventId
  ├ token 無し                      → S1 サインイン / サインアップ
  ├ email_verified: false           → S2 メール確認待ち
  ├ survey_answered: false          → S3 アンケート回答
  ├ app_access.is_open: false       → S4 開放待ち（30 秒ポーリングで開放に追随）
  ├ onboarding_completed: false     → S5 オンボーディング
  └ すべて済み                       → /home（出展者は /exhibitor）
```

回答完了から開放までは数日〜数週間空き、その間にセッションが切れ端末も変わる。
**状態を端末に持たない**のはこのため。オンボーディング既読も localStorage ではなく
サーバー（`users.onboarding_completed_at`）に置く。

## ディレクトリ

| パス | 責務 |
|------|------|
| `lib/resolveEntryStep.ts` | **段階の判定。導線そのもの。** 純粋関数なので分岐の追加はここだけを見る |
| `api/meState.ts` | `GET me/state` と `POST me/onboarding` |
| `api/presurveyApi.ts` | 設問取得と回答送信 |
| `pages/EntryPage.tsx` | 単一 URL の器。判定結果に応じて steps を出し分ける |
| `steps/` | 各段階の画面。自分では遷移せず、完了を `EntryPage` へ返す |
| `components/EntryLayout.tsx` | 各段階に共通の枠 |

## 注意

- **段階ごとの URL を増やさない。** 増やした時点で中断復帰の保証が崩れる
- 開放ゲートの 30 秒ポーリングは「回答済みかつ未開放」のときだけ動かす（それ以外は待つ理由が無い）
- 出展者・運営はアンケート導線に乗せない（`resolveEntryStep` が `app` を返す）
- 設問をフロントにハードコードしない（サーバー配信。P-11）
