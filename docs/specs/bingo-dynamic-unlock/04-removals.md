---
状態: 実装済み
最終更新: 2026-08-25
---

# 削除するもの

**中途半端に残さない。** 「動くはずなのに動かない」画面は当日の混乱の元になる。

## 1. 推薦欄 UI

| 対象 | 扱い |
|---|---|
| `src/features/checkin/pages/CheckInRecommendView.tsx` | **削除** |
| `fetchV1Recommendations` / `postV1SelectRecommendation`（`shared/api/v1Participant.ts`） | **削除** |
| `V1Recommendation*` 型・`v1RecommendationReasonLabel` | **削除** |

理由: **推薦を「推薦欄」のような外部 UI に切り出さない**という制約に反する。
研究上も、「ビンゴによる推薦の効果」と「推薦欄による効果」が混ざって測定できなくなる。

サーバー側のエンドポイントも削除される（サーバー D-11）。

## 2. 推薦理由文の表示

| 対象 | 扱い |
|---|---|
| `src/features/home/components/bingo/ReasonPanel.tsx` | **削除** |
| `BingoCell.reason` 型・参照箇所 | **削除** |

理由: ユーザーが読まない可能性が高く、ビンゴの形式自体が
「次にどう行動すればよいか」を直感的に伝えられるため（サーバー D-6）。

**代わりにブース説明（`booth.description`）を表示する。**
理由文のデータ自体はサーバーに記録され続けるが、API では返らない。

## 3. コインの表示

| 対象 | 扱い |
|---|---|
| ビンゴカードの `coins` 参照 | **削除** |
| ホーム画面のコイン枚数表示 | **削除**（ガチャが準備中のため） |

ビンゴカード API は `lines_completed` だけを返す。

## 4. 旧 Flask API の呼び出し

| 対象 | 扱い |
|---|---|
| `src/shared/api/legacyHttp.ts` | **削除** |
| `src/shared/api/legacyParticipant.ts` | **削除** |
| `ApiParticipantClient` の legacy 依存部分 | 削除し、準備中の扱いにする |
| `VITE_LEGACY_API_BASE_URL` | `.env.example` から削除 |

Fastify 側に実装が無く、**現状デプロイしても動かない。**
後から新 API で作り直すときに迷わないよう、消しておく。

## 5. ガチャ・アワード投票の画面

| 対象 | 扱い |
|---|---|
| `/gachapon` `/gachapon/use` `/gachapon/complete` | **ルートは残し、`LegacyPlaceholderPage`（準備中）に差し替える** |
| `/award-vote` | 同上 |

画面ごと消すのではなく、**明示的に「準備中」と出す。**
アクセスされたときに壊れるのではなく、何が起きているか分かる状態にする。

後から追加する（`event-support-server/docs/specs/gacha-and-award/`）。

## 6. 解放フラグ

| 対象 | 扱い |
|---|---|
| `src/shared/lib/bingoUnlockFlag.ts` | **作り直す**（削除ではない） |

単一のブール値から、`pair_key` ごとの独立したフラグへ
（[02-unlock-animation.md](02-unlock-animation.md)）。

## 確認

- [ ] `grep -r "legacyApi\|legacyParticipant" src/` が何も返さない
- [ ] `grep -r "recommendations\|ReasonPanel\|coins" src/` が意図した箇所以外を返さない
- [ ] `npm run build` と `npm run lint` が通る
