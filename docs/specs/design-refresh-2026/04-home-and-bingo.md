---
状態: 草案
最終更新: 2026-08-26
---

# ホーム画面とビンゴ盤

作業ブランチ: `feat/design/home-bingo`

**前提**：[01](01-design-tokens.md) と [03](03-bottom-navigation.md) が終わっていること。

## 触るファイル

| ファイル | 役割 |
|---|---|
| `src/features/home/pages/HomePage/HomePage.tsx` | ホーム画面 |
| `src/features/home/components/bingo/BingoCardView.tsx` | ビンゴ盤 |
| `src/features/home/components/bingo/BingoCellView.tsx` | マス 1 個 |
| `src/features/home/styles/bingo-card.scss` | ビンゴ盤のスタイル |
| `src/features/home/styles/legacy-home.scss` | ホームのスタイル |

## 画面の地

背景を `--pf-cream` 系にする。`legacy-app.scss` の `body { background-color: #fff }` が
効いているので、**参加者レイアウト側で上書きする**（`body` を直接いじると管理画面まで変わる）。

`background/onboarding-scene.png` は**オンボーディング専用**である
（キャラの居ない地面と草花の絵）。ホームの背景に流用しない。

## ロゴ

現状 `BingoCardView.tsx` がテキストで `PRoTo FES` と出している（86〜95 行目付近）。
これを `/brand/logo-protofes.png` の画像に置き換える。

**ロゴの位置は要判断。** アート仕様書ではロゴは画面上部のヘッダーにあり、
ビンゴカードの内側ではない。ヘッダーを作るなら [03](03-bottom-navigation.md) の
`ParticipantLayout` 側の仕事になる。**どちらに置くか決めてから着手する。**

## ビンゴ盤

### 素材

| 用途 | パス |
|---|---|
| マスの地（空・未開放） | `/bingo/bingo-grid-empty.png` |
| 埋まったマスのスタンプ | `/bingo/bingo-cell-stamp.png` |
| 埋まったマスの星＋紙吹雪 | `/bingo/bingo-cell-star.png` |
| ライン成立バッジ | `/bingo/bingo-line-badge.png` |

`/bingo/bingo-grid-filled.png` は**盤全体が埋まった一枚絵**であり、マス単位では使えない。
ポップアップ用なので [05-modals.md](05-modals.md) 側で扱う。

### 現状の 3 状態を壊さない

`bingo-card.scss` には既に 3 状態のクラスがある。
**サーバーが返す `is_revealed` / `is_achieved` の意味は変えない**
（[bingo-dynamic-unlock/01-card-display.md](../bingo-dynamic-unlock/01-card-display.md) が正本）。
差し替えるのは見た目だけ。

| クラス | 状態 | 2026 年版の見た目 |
|---|---|---|
| `.bingo-cell-locked` | 未開放 | `--pf-surface` の地。中身を出さない |
| `.bingo-cell-empty` | 開放済み・未訪問 | 同じ地にブース名 |
| `.bingo-cell-achieved` | 達成 | スタンプ画像を重ねる |

現状の達成マークは緑のチェック（`.bingo-cell-check`、`#2e9e5b`）である。
**2026 年版の配色に緑は無い。** `/bingo/bingo-cell-stamp.png` に置き換える。

### スタンプと星の使い分け（要判断）

達成マスの素材が 2 種類ある。

- `bingo-cell-stamp.png` — キャラの顔（丸囲み）
- `bingo-cell-star.png` — 星＋紙吹雪

アート仕様書ではどちらも達成マスに刺さっており、**使い分けが読み取れない。**
「通常の達成はスタンプ、ライン成立に寄与したマスは星」という解釈はあり得るが、
**推測で実装しない。** 決めてから着手する。

### アニメーション

`UnlockAnimation.tsx` と `bingo-card.scss` の解放演出には
**「当日 13:30-15:30 に集中発火するため重いアニメーションは避ける」**という
既存の制約がコメントで明記されている。

**画像を重ねる方式に変えるときも、この制約を守る。**
大きな PNG を多数同時にフェードインさせない。

## ボタン

`ui/button/` の素材は**文字なしの背景画像**であり、色はこちらで塗れる前提で作られている。

| 素材 | 用途 |
|---|---|
| `/ui/button/button-primary.png` | 黄色の主要ボタン |
| `/ui/button/button-outline.png` | 白地・枠線の副ボタン |
| `/ui/button/button-surface.png` | 白の塗り潰し |
| `/ui/button/bottom-bar-primary.png` | 画面下端に敷く帯（上辺がカーブ） |

**まず CSS で再現できないか試すこと。** 単純な角丸の矩形は、
`background: var(--pf-yellow)` + `border-radius: var(--pf-radius-pill)` で出せる。
画像にすると拡大縮小でぼやけ、転送量も増える。

**画像が要るのは形が CSS で出せないものだけ**である。具体的には
`bottom-bar-primary.png`（上辺だけカーブした帯）と、
[03](03-bottom-navigation.md) の `nav-bar-notched.png`（中央が飛び出す帯）。

## 完了の条件

- ホームとビンゴ盤が 2026 年版の配色になっている
- ビンゴの 3 状態が従来どおり区別でき、解放演出が従来どおり動く
- 既存のビンゴ関連テストが通る（`npm run test`）
- `npm run build` が通る
