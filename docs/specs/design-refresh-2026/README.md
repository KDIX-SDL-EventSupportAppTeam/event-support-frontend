---
状態: 確定
最終更新: 2026-08-26
---

# 2026年版デザイン適用

**目的。** 受領した 2026 年版アート素材を参加者向け画面へ適用し、前年の暫定 UI を置き換える。

**この文書群は別セッションの実装者（Claude Code）への指示書である。** 実装に入る前に
まず [00-context.md](00-context.md) を読むこと。リポジトリの前提と現状がそこに書いてある。

## 範囲

**参加者向け画面のみ。** `/admin/*`（運営）と `/exhibitor` `/organizer/*`（出展者・主催者）は
**今回は対象外。触らない。** 別途あらためて適用する。

## ファイル

| ファイル | 内容 | 状態 |
|---|---|---|
| [00-context.md](00-context.md) | 前提・現状のコード・共通の作法 | 確定 |
| [01-design-tokens.md](01-design-tokens.md) | 配色の全面置き換え | 確定 |
| [02-legacy-asset-cleanup.md](02-legacy-asset-cleanup.md) | 前年素材の参照解消・ファビコン | 確定 |
| [03-bottom-navigation.md](03-bottom-navigation.md) | ボトムナビ（新規）と参加者レイアウト | 確定 |
| [04-home-and-bingo.md](04-home-and-bingo.md) | ホーム画面・ビンゴ盤・進捗ステッパー | 確定 |
| [05-modals.md](05-modals.md) | 完了ポップアップ・モーダル | 確定 |
| [06-onboarding.md](06-onboarding.md) | オンボーディング（新規画面） | 確定 |
| [07-venue-map.md](07-venue-map.md) | 会場マップ（新規画面・画像は代用） | 確定 |
| [08-tweets-placeholder.md](08-tweets-placeholder.md) | つぶやき導線（ボタンのみ） | 確定 |

## 作業の分け方

統合ブランチ `integration/2026-08-design-refresh` から作業ブランチを生やし、
**統合ブランチへ PR を出す。** `develop` へ直接出さない。

```
integration/2026-08-design-refresh
  ├─ 1. feat/design/tokens            ← 01
  ├─ 2. fix/design/legacy-asset-paths ← 02
  ├─ 3. feat/design/bottom-nav        ← 03
  ├─ 4. feat/design/home-bingo        ← 04
  ├─ 5. feat/design/venue-map         ← 07   ┐
  ├─ 6. feat/design/modals            ← 05   ├ 3 の完了後は並行可
  ├─ 7. feat/design/tweets-button     ← 08   ┘
  └─ 8. feat/design/onboarding        ← 06
```

**1 → 2 → 3 → 4 は順番に行う。** 5〜7 は 3 が終わっていれば並行してよい。
8（オンボーディング）は最後。他が固まってからでないとスライドの中身が決まらない。

## この改訂で決まったこと

前版で「要判断」としていた項目は、2026-08-26 に次のとおり決定した。

| 論点 | 決定 |
|---|---|
| 会場マップ | **今回に含める。** ただし単純な画像表示に留める |
| 会場マップの画像 | 素材未着のため `/bingo/bingo-grid-empty.png` で**代用** |
| ブースマーカー | **不要。** マップを出すだけでよい |
| 通知ベル・ヘッダー | **不要。仕様から完全に削除** |
| メニュー画面 | **不要。** ナビから削除 |
| つぶやき | **ボタンのみ作る。** 画面は作らない。HTML/CSS で組む |
| ボトムナビ構成 | ホーム / ブース一覧 / チェックイン(FAB) / スケジュール / アワード投票 |
| スマホ枠 | 素材が無いため `/onboarding/award-screen-*.png` で全スライド代用 |
| ビンゴ進捗ステッパー | **CSS で実装。** 最大値はガチャコイン最大所有枚数（= 4） |
| ファビコン | `/mascot/mascot-cheering.png` から生成 |
| コインのアイコン | 大小を分けず `/gacha/coin.png` を共用 |
| 前年配色 | **完全に廃止。** ただし運営・出展者画面は今回対象外 |
| オンボーディング既読 | **localStorage。** サーバーには持たない |
