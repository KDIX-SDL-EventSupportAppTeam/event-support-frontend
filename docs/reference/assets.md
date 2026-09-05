---
状態: 実装済み
最終更新: 2026-08-26
---

> **現状の事実を記録する文書。** 「これからどうするか」は [../specs/](../specs/README.md) を見ること。

# 静的アセット（`public/`）

2026 年版のアート素材。アート担当から受領した素材を、エンジニア目線の命名に統一して
`public/` 直下へ意味単位で配置している。Vite の `public/` なので、**参照は絶対パス**
（`/mascot/mascot-with-gavel.png` のように、`public/` を含めない）。

## ディレクトリ構成

```
public/
├── brand/          # PROTOFES ロゴ
├── background/     # 画面全体の背景イラスト
├── mascot/         # キャラクター単体
├── ui/
│   ├── button/     # 文字なしのボタン背景（色はCSSで塗る）
│   └── nav/        # ボトムナビの帯背景
├── icon/
│   ├── nav/        # ボトムナビの項目アイコン・中央FAB
│   ├── action/     # 汎用操作アイコン（閉じる・メニュー・ジェスチャー等）
│   ├── feature/    # 円形の機能アイコン（ビンゴ・マップ・アワード等）
│   └── status/     # 状態表示アイコン（警告）
├── bingo/          # ビンゴ盤・マス素材
├── gacha/          # ガチャコイン
├── map/            # 会場マップ関連
├── onboarding/     # オンボーディングの一枚絵
├── feedback/       # 完了ポップアップ用イラスト
├── favicon.png     # ブラウザタブのアイコン（mascot-cheering.png から生成）
└── legacy/         # 前年版の素材（下記「legacy」を参照）
```

## 命名ルール

- すべて小文字の **kebab-case**、拡張子は `.png`
- `<接頭辞>-<対象>-<バリアント>.png`。接頭辞はディレクトリと対応させる
  （`nav-*` / `feature-*` / `bingo-*` / `popup-*` / `mascot-*`）
- バリアントは末尾サフィックスで表す

| サフィックス | 意味 |
|---|---|
| `-active` | 選択・アクティブ状態 |
| `-glow` | キラキラ装飾つき |
| `-on-primary` | 塗り潰しボタンの上に載せる白版 |
| `-opaque` | 背景が透過していない版 |
| `-empty` / `-filled` | 空・埋まった状態 |

**アート担当が付けた元のファイル名（`1-4-...`, `ChatGPT Image ...`, UUID 等）は使わない。**
仕様書の採番はあくまで受領時の対応付けのためのもので、ファイル名には持ち込まない。

## ファイル一覧

### brand / background

| パス | 用途 |
|---|---|
| `brand/logo-protofes.png` | PROTOFES ロゴ（タグライン付き）。**1024×1536 のうちロゴ本体は 905×127 で、残りは透明な余白。** そのまま `height` 指定で置くと極小になるため、表示は共有クラス `.pf-logo`（`src/shared/styles/brand-logo.scss`）を使う |
| `background/onboarding-scene.png` | オンボーディングの背景のみ（キャラ・文字なし） |
| `favicon.png` | ブラウザタブのアイコン。`mascot/mascot-cheering.png` に `--pf-cream` の下地を敷いて 512×512 で書き出したもの |

### mascot

| パス | 用途 |
|---|---|
| `mascot/mascot-with-gavel.png` | 木槌を持って手を振るキャラ |
| `mascot/mascot-with-gavel-glow.png` | 同上・キラキラ装飾つき |
| `mascot/mascot-cheering.png` | 両手を上げて喜ぶキャラ |
| `mascot/mascot-with-qr.png` | QR カードを持つキャラ |
| `mascot/mascot-with-map.png` | 地図とピンを持つキャラ |
| `mascot/mascot-with-coin.png` | ガチャコインを掲げるキャラ。`/gachapon/complete` |

### ui

| パス | 用途 |
|---|---|
| `ui/button/button-primary.png` | 黄色の角丸ボタン背景（文字なし） |
| `ui/button/button-outline.png` | 白地・枠線の汎用ボタン背景 |
| `ui/button/button-surface.png` | 白の塗り潰しボタン背景 |
| `ui/button/bottom-bar-primary.png` | 画面下端に敷く黄色の帯（上辺がカーブ） |
| `ui/nav/nav-bar-flat.png` | ボトムナビの帯（中央に丸の切り欠き・影なし） |
| `ui/nav/nav-bar-notched.png` | 同上・中央の丸が飛び出し＋影あり |

### icon/nav

| パス | 用途 |
|---|---|
| `icon/nav/nav-home.png` | ホーム（非選択） |
| `icon/nav/nav-home-active.png` | ホーム（選択中・オレンジ） |
| `icon/nav/nav-map.png` | 会場マップ |
| `icon/nav/nav-guide.png` | 参加ガイド |
| `icon/nav/nav-schedule.png` | スケジュール |
| `icon/nav/nav-fab-checkin.png` | 中央の丸ボタン：チェックイン |
| `icon/nav/nav-fab-award.png` | 中央の丸ボタン：アワード投票 |
| `icon/nav/nav-set-home-checkin-guide.png` | 3項目が1枚に合成された版（個別素材があるため通常は使わない） |

### icon/action

| パス | 用途 |
|---|---|
| `icon/action/close.png` | 閉じる（円形背景つき） |
| `icon/action/menu.png` | ハンバーガーメニュー |
| `icon/action/qr-grid.png` | チェックイン導線の4分割グリッド |
| `icon/action/guide-book.png` | アプリ説明（開いた本） |
| `icon/action/gacha-bag.png` | ガチャコイン袋（黄色の線画）。**未使用**（白版のみ使用中） |
| `icon/action/gacha-bag-on-primary.png` | 同上・黄色ボタンに載せる白版。ホームのガチャポンボタン |
| `icon/action/gesture-swipe.png` | 左右スワイプ操作の説明 |
| `icon/action/gesture-tap-phone.png` | 画面タップ操作の説明 |

### icon/feature

円形の枠つきアイコン。オンボーディングと画面内の機能導線で共用する。

| パス | 用途 |
|---|---|
| `icon/feature/feature-bingo.png` | ビンゴ |
| `icon/feature/feature-map.png` | 会場マップ |
| `icon/feature/feature-award.png` | アワード投票（トロフィー） |
| `icon/feature/feature-checkin.png` | チェックイン（スマホ＋QR） |
| `icon/feature/feature-schedule.png` | スケジュール |
| `icon/feature/feature-floor-map.png` | フロアマップ表示切替 |
| `icon/feature/feature-booth-list.png` | リスト表示切替 |
| `icon/feature/feature-current-location.png` | 現在地の確認 |
| `icon/feature/feature-next-booth.png` | 次のブースへ |
| `icon/feature/feature-prize-gift.png` | 景品ゲット |
| `icon/feature/feature-award-trophy-bubble.png` | 吹き出し入りトロフィー |

### icon/status

| パス | 用途 |
|---|---|
| `icon/status/warning.png` | 警告（透過） |
| `icon/status/warning-opaque.png` | 警告（白背景・透過が不要な場面用） |

### bingo / gacha / map

| パス | 用途 |
|---|---|
| `bingo/bingo-grid-empty.png` | ビンゴ盤のマス背景（空） |
| `bingo/bingo-grid-filled.png` | ビンゴ盤（全マス埋まった達成イラスト） |
| `bingo/bingo-cell-stamp.png` | 埋まったマスのキャラスタンプ |
| `bingo/bingo-cell-star.png` | 埋まったマスの星＋紙吹雪 |
| `bingo/bingo-line-badge.png` | ビンゴ成立バッジ（星入りグリッド） |
| `gacha/coin.png` | ガチャコイン（金）。`/gachapon/use` の所持枚数表示 |
| `map/booth-number-card.png` | ブース番号カード |

### onboarding

| パス | 用途 |
|---|---|
| `onboarding/bingo-flow-steps.png` | ブース訪問→チェックイン→ビンゴ→景品の導線図（一枚絵） |
| `onboarding/award-screen-decorated.png` | アワード投票画面の紹介（周囲の装飾込み） |
| `onboarding/award-screen-plain.png` | 同上・装飾なしの版 |

### feedback

ポップアップの中に敷くイラスト。**ボタンは含まれていない**ので、ボタンは UI 側で組む。

| パス | 用途 |
|---|---|
| `feedback/popup-bingo-complete.png` | 全ビンゴ達成 |
| `feedback/popup-coin-complete.png` | 全ガチャコイン獲得（ホームで上限到達時に1回） |
| `feedback/popup-vote-complete.png` | 投票完了 |

## legacy

`public/legacy/` は**前年版の素材**。`favicon.ico` / `logo.png` / `logo_main.png` /
`icons/*.png` が入っている。2026 年版の素材へ差し替えるまでの一時的な置き場で、
**新規実装では参照しない。**

**参照パスの不整合は解消済み**（[specs/design-refresh-2026/02-legacy-asset-cleanup.md](../specs/design-refresh-2026/02-legacy-asset-cleanup.md)）。
`src/` から `public/legacy/` を参照している箇所は無い。
ホームのボタングリッドにあった 4 件は [03](../specs/design-refresh-2026/03-bottom-navigation.md) の
ボトムナビ導入でボタンごと削除された。ファイル自体は復帰用に残している。

## 未受領の素材

アート仕様書にはあるが**まだ届いていないもの。** 代用の方針は
[specs/design-refresh-2026/](../specs/design-refresh-2026/README.md) に書いてある。

| 素材 | 仕様書の採番 | 現在の代用 |
|---|---|---|
| 会場全体簡略マップ | 3-6 | `bingo/bingo-grid-empty.png`（受領後 `map/venue-map.png` へ） |
| スマホモックアップ枠（ホーム / ビンゴカード / 会場マップ。#89 でアワード投票を出す場合はアワード投票画面も） | 4-1-1 | `onboarding/award-screen-*.png`（受領後 `onboarding/mockup-home.png` / `mockup-bingo-card.png` / `mockup-venue-map.png` / `mockup-award.png` へ） |
| ファビコン | — | `mascot/mascot-cheering.png` から生成 |
| つぶやき関連（鉛筆・ハート・吹き出し） | — | 使わない。`bootstrap-icons` で代替 |

**不要と決まったもの**（依頼しない）:

- 通知ベル — 通知機能を作らないため
- ブースマーカー — 会場マップは画像を出すだけのため
- ビンゴ進捗ステッパー（仕様書 p.8 の 3-3） — CSS で実装するため

> 仕様書では `3-3` の採番が 2 箇所で重複している（p.8 の進捗ステッパー、
> p.10 のビンゴ完了ポップアップ）。受領したのは後者のみ。

## 素材を追加するとき

1. 上のディレクトリのどれに当たるかを決める（当てはまらなければディレクトリごと追加し、この文書に追記する）
2. 命名ルールに従ってリネームする。**受領時のファイル名は残さない**
3. この文書の一覧に行を足す（[rules/documentation.md](../rules/documentation.md)）
