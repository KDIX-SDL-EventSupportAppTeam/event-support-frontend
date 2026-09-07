---
状態: 実装済み
最終更新: 2026-09-07
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

## 寸法の規約（`icon/` 配下）

`public/icon/**` の素材は、**透明余白を切り落とした正方形キャンバスに上下左右 4% の
余白を付けて中央配置** した状態で置いてある（絵柄の占有率は 0.85〜0.93）。
理由と経緯は [ADR 0005](../decisions/adrs/0005-icon-canvas-normalization.md)。

そのため **UI 側は固定の正方形ボックス＋`object-fit: contain` で描けば、どの
アイコンも同じ大きさに見える。** `max-height` だけで寸法を決めてはいけない
（素材ごとの余白の差がそのまま見た目の大小になる）。

| 描画箇所 | 寸法 |
|---|---|
| ボトムナビ 側の4項目 | `--pf-nav-icon-size` = 2.5rem（360px 以下では 2.1rem。`shared/components/layout/bottom-nav.scss`） |
| ボトムナビ 中央FAB | `--pf-nav-fab-size` = 4.2rem（360px 以下では 3.6rem） |
| オンボーディングの機能アイコン・スワイプ説明 | 3rem 角（`.onboarding-feature-icon` / `.onboarding-gesture-hint`） |
| ホームのガチャポン袋 | 32px 角（`.gachapon-icon`） |
| ガチャコイン | 40px 角（`.coins-display img`） |
| 注意事項の警告アイコン | 96px 角（`.gachapon-notice-icon`） |

例外は `icon/nav/nav-set-home-checkin-guide.png` だけ。3 項目が横に並ぶ合成画像なので
正方形化しない。

**ラベル文字の焼き込み**: ボトムナビで焼き込みラベルを持つ素材を使うのは中央 FAB だけ。
側の 4 項目は文字なしのグリフに揃え、ラベルは `BottomNav` の `showLabel` で HTML 側に出す。

## ファイル一覧

### brand / background

| パス | 用途 |
|---|---|
| `brand/logo-protofes.png` | PROTOFES ロゴ。**905×127・透明余白なし**（2026-09 の更新で余白入りの 1024×1536 から差し替わった）。`height` を与えるだけで正しい大きさで出る。共有クラス `.pf-logo`（`src/shared/styles/brand-logo.scss`）は縦横比の保証だけを担う |
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
| `ui/nav/nav-bar-notched.png` | 同上・中央の丸が飛び出し＋影あり。**受領時は 1536×1024 のうち帯が写っているのは y=355〜729 だけで、上下が透明な余白だった。** `object-fit: fill` で伸ばしても帯がナビの高さの 37% ほどにしかならずアイコンが帯からはみ出すため、余白を切り落として 1451×375 にしてある |

### icon/nav

| パス | 用途 |
|---|---|
| `icon/nav/nav-home.png` | ホーム（非選択）。合成画像から家のグリフだけを切り出したもの |
| `icon/nav/nav-home-active.png` | ホーム（選択中・オレンジ）。同上 |
| `icon/nav/nav-map.png` | 会場マップ。**未使用**（「会場マップ」の文言が焼き込まれており `/venue-map` と紛らわしい） |
| `icon/nav/nav-guide.png` | 参加ガイド。合成画像から本のグリフだけを切り出したもの。**現在ボトムナビに参加ガイド項目は無く未使用** |
| `icon/nav/nav-schedule.png` | スケジュール |
| `icon/nav/nav-fab-checkin.png` | 中央の丸ボタン：チェックイン。「チェックイン」の文字が焼き込まれている |
| `icon/nav/nav-fab-award.png` | 中央の丸ボタン：アワード投票。「アワード投票」の文字が焼き込まれている。**未使用**（アワード投票は側の項目になり、文字なしの `feature-award.png` を使う） |
| `icon/nav/nav-set-home-checkin-guide.png` | ホーム／チェックイン／参加ガイドが1枚に合成された版。**描画には使わない。** `nav-home` / `nav-guide` の切り出し元 |

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
| `icon/feature/feature-award.png` | アワード投票（トロフィー）。文字が入っていないため、ボトムナビのアワード投票項目でも使う |
| `icon/feature/feature-checkin.png` | チェックイン（スマホ＋QR） |
| `icon/feature/feature-schedule.png` | スケジュール |
| `icon/feature/feature-floor-map.png` | フロアマップ表示切替 |
| `icon/feature/feature-booth-list.png` | リスト表示切替。ボトムナビの「ブース一覧」でも使う |
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

## 2026-09-06 受領分（`アプリデザイン素材` 修正版）

受領した ZIP 全 73 点をハッシュで既存素材と突き合わせ、**内容が異なる 16 点だけ**を
取り込んだ。**全件が既存素材の改訂版で、新しい種類の素材は増えていない。**

| 受領時のファイル名 | 取り込み先 | 変わったこと |
|---|---|---|
| `1-/修正版/PROTOFES　修正.png` | `brand/logo-protofes.png` | 1024×1536（約92%が透明余白）→ 905×127 の余白なし版 |
| `1-/修正版/1-7b-checkin-qr-final.png` | `icon/nav/nav-fab-checkin.png` | 合成画像からの 400×300 切り出し → 1254×1254 の単体素材。QR の潰れが解消 |
| `1-/修正版/1-7-navigation-items-checkin-qr-final.png` | `icon/nav/nav-set-home-checkin-guide.png` | 1200×300 → 2400×600 |
| `2-/修正版/01-phone-tap.png` | `icon/action/gesture-tap-phone.png` | **背景の透過**（下記） |
| `2-/修正版/02-star.png` | `bingo/bingo-cell-star.png` | 同上 |
| `2-/修正版/03-menu.png` | `icon/action/menu.png` | 同上 |
| `2-/修正版/04-white-bag.png` | `icon/action/gacha-bag-on-primary.png` | 同上 |
| `2-/修正版/05-close.png` | `icon/action/close.png` | 同上 |
| `2-/修正版/06-yellow-character-circle.png` | `bingo/bingo-cell-stamp.png` | 同上 |
| `2-/修正版/07-bingo-grid.png` | `bingo/bingo-grid-empty.png` | 同上 |
| `2-/修正版/08-book.png` | `icon/action/guide-book.png` | 同上 |
| `2-/修正版/09-swipe.png` | `icon/action/gesture-swipe.png` | 同上 |
| `2-/修正版/10-g-bag.png` | `icon/action/gacha-bag.png` | 同上 |
| `2-/修正版/11-four-grid.png` | `icon/action/qr-grid.png` | 同上 |
| `2-/修正版/12-bingo-card.png` | `bingo/bingo-grid-filled.png` | 同上 ＋ 1254×1254 → 1327×1185 |
| `2-/修正版/13-g-coin.png` | `gacha/coin.png` | 同上 |

### いちばん効いた変更: 背景の透過

**旧素材 11 点は背景が透明ではなく、`#fdfdfd` 前後の不透明な白で塗り潰されていた**
（アルファ値が全ピクセル 255）。クリーム地（`--pf-cream-light`）の上に置くと、
絵柄の周りに白い四角が出る状態だった。修正版はいずれも完全な透過で届いている。

| 素材 | 旧: 完全透明なピクセルの割合 | 新 |
|---|---|---|
| `icon/action/menu.png` | 0% | 86% |
| `bingo/bingo-cell-star.png` | 0% | 92% |
| `icon/action/close.png` | 0% | 37% |
| `gacha/coin.png` | 0% | 33% |

副次効果としてファイルサイズも大きく減った（例: `logo-protofes.png` 656KB → 64KB、
`icon/action/menu.png` 727KB → 101KB）。16 点合計で 11.6MB → 6.0MB。

取り込まなかったもの:

- `3-/3-4-mascot-with-coin.png` — 透過版（`3-4-...-transparent.png`）を
  `mascot/mascot-with-coin.png` として既に取り込み済み。透過なし版は使わない
- 上記以外の 56 点 — バイト単位で既存素材と一致（差分なし）

### 反映の結果

- **ボトムナビの見た目が揃った。** 素材差し替えで `nav-fab-checkin.png` の絵柄占有率が
  0.96 になり、旧 `nav-home.png`（0.34）との差が目立つようになったため、
  `icon/**` 全体を正方形キャンバスへ正規化した（[ADR 0005](../decisions/adrs/0005-icon-canvas-normalization.md)）
- **`.pf-logo` の余白切り落としハックを削除できた。** 新しいロゴが余白なしで届いたため
- **ボトムナビの焼き込みラベルを整理した。** ホーム / 参加ガイドのグリフを合成画像から
  切り出し、側 4 項目は文字なし＋HTML ラベルに統一。アワード投票は
  `nav-fab-award.png`（文字焼き込み）から `feature-award.png`（文字なし）へ変更
- ホームのビンゴ盤・ガチャコイン・注意事項の警告アイコンは、素材差し替えと
  正方形化の両方が効いて、指定したボックスをきちんと埋めるようになった

## 未受領の素材

アート仕様書にはあるが**まだ届いていないもの。** 代用の方針は
[specs/design-refresh-2026/](../specs/design-refresh-2026/README.md) に書いてある。
2026-09-06 の受領分では**いずれも解消していない。**

| 素材 | 仕様書の採番 | 現在の代用 | 影響 |
|---|---|---|---|
| 会場全体簡略マップ | 3-6 | `bingo/bingo-grid-empty.png` | `/venue-map` にビンゴ盤の画像がそのまま出ている。実用上いちばん困っている欠品 |
| スマホモックアップ枠 | 4-1-1 | `onboarding/award-screen-*.png` | オンボーディングの画面紹介が実画面のスクリーンショット風のままで、枠が付かない |
| ファビコン | — | `mascot/mascot-cheering.png` から生成 | 実用上の問題なし。専用素材が来れば差し替える |
| つぶやき関連（鉛筆・ハート・吹き出し） | — | `bootstrap-icons` で代替 | 使わないと決めた |

**今回の反映作業で新たに欲しくなったもの**（未依頼）:

| 素材 | 欲しい理由 |
|---|---|
| `feedback/popup-coin-complete.png` の透過版 | 3 枚あるポップアップ用イラストのうち、これだけ背景が `#f4f4f4` の不透明な塗りのまま（他の 2 枚は透過済み）。2026-09 の修正版には含まれていなかった |
| ホーム／スケジュールの円形アイコン | ボトムナビ側 4 項目のうち、ブース一覧とアワード投票だけが `feature-*` の円枠つき、ホームとスケジュールは枠なしのグリフで、絵柄のトーンが揃っていない。寸法は揃ったが、枠の有無は素材が無いと揃えられない |
| ボトムナビ用の参加ガイド項目 | `icon/nav/nav-guide.png` は用意してあるが、現在ボトムナビに参加ガイドの項目が無く未使用。項目を足すかどうかは UI 仕様の判断待ち |

**不要と決まったもの**（依頼しない）:

- 通知ベル — 通知機能を作らないため
- ブースマーカー — 会場マップは画像を出すだけのため
- ビンゴ進捗ステッパー（仕様書 p.8 の 3-3） — CSS で実装するため

> 仕様書では `3-3` の採番が 2 箇所で重複している（p.8 の進捗ステッパー、
> p.10 のビンゴ完了ポップアップ）。受領したのは後者のみ。

## 素材を追加するとき

1. **受領した全ファイルをハッシュで既存素材と突き合わせ、内容が異なるものだけを取り込む。**
   同じ名前でも中身が同じなら触らない（差分レビューが読めなくなる）
2. 上のディレクトリのどれに当たるかを決める（当てはまらなければディレクトリごと追加し、この文書に追記する）
3. 命名ルールに従ってリネームする。**受領時のファイル名は残さない**
4. `icon/` 配下なら「[寸法の規約](#寸法の規約icon-配下)」のとおり正方形キャンバスへ正規化する
   （透明余白を切り落とし → 長辺の 1.08 倍の正方形に中央配置）
5. この文書の一覧に行を足す（[rules/documentation.md](../rules/documentation.md)）
6. 素材を1枚でも差し替えたら、`tests/unit/asset-references.test.ts` を通して
   参照が壊れていないことを確かめる
