---
状態: 草案
最終更新: 2026-08-24
---

# ビンゴカード動的段階解放（UI 仕様）

**API 契約・ビジネスルールの正本は `event-support-server/docs/specs/bingo-dynamic-unlock/`。**
ここには画面の仕様だけを書く。サーバー側の内容をコピーしない。

## サーバー側で必ず読むもの

| 内容 | 場所 |
|---|---|
| 全体像と制約 | `event-support-server/docs/specs/bingo-dynamic-unlock/README.md` |
| API のレスポンス形 | 同 `06-api/participant-api.md` |
| 中央ペアと開放列の対応 | 同 `03-card-lifecycle/unlock-pairs.md` |

## 一言でいうと画面がどう変わるのか

- カードは最初、**中央4マスのうち1マスだけに中身が見えている**状態で表示される
- 参加者が自由にブースを回ると中央マスが埋まる
- **中央が2つ埋まるたび、外周のマスが開く。これが最大3回起きる**
- 開くたびに演出を出す。**1回きりではない**

## ファイル

| ファイル | 内容 |
|---|---|
| [01-card-display.md](01-card-display.md) | マスの見せ方 |
| [02-unlock-animation.md](02-unlock-animation.md) | 解放演出（**3回それぞれ独立**） |
| [03-checkin-flow.md](03-checkin-flow.md) | チェックイン成功モーダルと評価 |
| [04-removals.md](04-removals.md) | 削除するもの |
| [10-testing/](10-testing/) | 合格基準 |

## 絶対に守ること

1. **フロントで計算しない。** 進捗・ライン数・開放状態はサーバーのレスポンスをそのまま出す
2. **見えないマスの中身を表示しない。** `booth` が `null` で来るので、そもそも出せない
3. **解放演出の再生済みフラグを解放イベントごとに独立して持つ。**
   1回きり前提の実装（localStorage の単一フラグ）を残さない
4. **推薦を別 UI に切り出さない。** 推薦はビンゴのマスとしてだけ現れる
