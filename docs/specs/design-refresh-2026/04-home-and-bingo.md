---
状態: 確定
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

背景は `.pf-2026` 側（[01](01-design-tokens.md)）で `--pf-cream-light` が当たっている。
**`body` を直接いじらない**（管理画面まで変わる）。

`background/onboarding-scene.png` は**オンボーディング専用**である
（キャラの居ない地面と草花の絵）。ホームの背景に流用しない。

## ロゴ

ヘッダーを作らないと決まったため、**ロゴは現状どおりビンゴカード内に置く。**
`BingoCardView.tsx` の 86〜95 行目付近がテキストで `PRoTo FES` と出しているので、
これを `/brand/logo-protofes.png` の画像に置き換える。

## ビンゴ盤

**盤は 4×4 = 16 マス**である（`BingoCardView.tsx` の `col-3`、
`sampleBingoCard.ts` の `length: 16`）。受領素材の 4×4 グリッドと一致している。
**5×5 のモックに引きずられないこと。**

### 素材

| 用途 | パス |
|---|---|
| マスの地（空・未開放） | `/bingo/bingo-grid-empty.png` |
| 達成マスのスタンプ | `/bingo/bingo-cell-stamp.png` |
| ライン成立に寄与したマス | `/bingo/bingo-cell-star.png` |
| ライン成立バッジ | `/bingo/bingo-line-badge.png` |

`/bingo/bingo-grid-filled.png` は**盤全体が埋まった一枚絵**でマス単位に使えない。
ポップアップ用なので [05-modals.md](05-modals.md) 側で扱う。

### 3 状態を壊さない

**サーバーが返す `is_revealed` / `is_achieved` の意味は変えない**
（[bingo-dynamic-unlock/01-card-display.md](../bingo-dynamic-unlock/01-card-display.md) が正本）。
差し替えるのは見た目だけ。

| クラス | 状態 | 2026 年版の見た目 |
|---|---|---|
| `.bingo-cell-locked` | 未開放 | `--pf-surface` の地。中身を出さない |
| `.bingo-cell-empty` | 開放済み・未訪問 | 同じ地にブース名 |
| `.bingo-cell-achieved` | 達成 | `bingo-cell-stamp.png` を重ねる |

現状の達成マークは緑のチェック（`.bingo-cell-check`、`#2e9e5b`）である。
**2026 年版の配色に緑は無い。** スタンプ画像に置き換える。

### スタンプと星の使い分け

```
  達成したマス                    → bingo-cell-stamp.png（キャラの顔）
  そのうちライン成立に寄与したマス → bingo-cell-star.png（星＋紙吹雪）
```

ライン成立の判定は**サーバーの `lines_completed` を正とし、フロントで数え直さない。**
どのマスが寄与したかをサーバーが返していない場合は、
**星は使わず全達成マスをスタンプにする。** 判定ロジックをフロントで書かないこと。

### アニメーション

`UnlockAnimation.tsx` と `bingo-card.scss` の解放演出には
**「当日 13:30-15:30 に集中発火するため重いアニメーションは避ける」**という
既存の制約がコメントで明記されている。

**画像を重ねる方式に変えるときもこの制約を守る。**
大きな PNG を多数同時にフェードインさせない。

## ビンゴ進捗ステッパー

モックにある「現在のビンゴ数 1/5」の丸い連番インジケータ。
**素材は無い。CSS だけで実装する。**

```
   ●───●───○───○
   1   2   3   4
   ↑達成済み  ↑未達成
```

- 達成済み: `--pf-yellow` 塗り＋`--pf-ink-strong` の数字
- 未達成: `--pf-surface` 塗り＋`--pf-ink-muted` の数字
- 連結線: `--pf-yellow`（達成区間）/ `--pf-ink-muted` 20% 程度（未達成区間）

### 最大値

**ガチャコインの最大所有枚数（= 4）を参照する。** モックの「5」ではない。

現状この 4 は 2 箇所にべた書きされている。

- `src/shared/data/sample/SampleEventData.ts:52` — `Math.min(4, ...)`
- `src/features/home/pages/HomePage/HomeTutorialModal.tsx:14` — 「最大4枚まで」の文言

**共有定数へ切り出し、3 箇所目を増やさないこと。**

```ts
// src/shared/config/gachapon.ts など
export const MAX_GACHAPON_COINS = 4
```

上の 2 箇所もこの定数を参照するよう直す。文言はテンプレートで組み立てる。

現在値は `card.lines_completed` をそのまま使う。**フロントで数え直さない。**

## ボタン

`ui/button/` の素材は**文字なしの背景画像**であり、色はこちらで塗れる前提で作られている。

**まず CSS で再現できないか試すこと。** 単純な角丸の矩形は
`background: var(--pf-yellow)` + `border-radius: var(--pf-radius-pill)` で出せる。
画像にすると拡大縮小でぼやけ、転送量も増える。

**画像が要るのは形が CSS で出せないものだけ**である。具体的には
`bottom-bar-primary.png`（上辺だけカーブした帯）と
`nav-bar-notched.png`（中央が飛び出す帯）の 2 つ。

## 完了の条件

- ホームとビンゴ盤が 2026 年版の配色になっている
- ビンゴの 3 状態が従来どおり区別でき、解放演出が従来どおり動く
- 進捗ステッパーが 4 段階で表示され、最大値が定数から来ている
- 既存のビンゴ関連テストが通る（`npm run test`）
- `npm run build` が通る
