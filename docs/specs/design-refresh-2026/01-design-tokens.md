---
状態: 確定
最終更新: 2026-08-26
---

# デザイントークンと配色の全面置き換え

作業ブランチ: `feat/design/tokens`

## やること

**前年の配色（オレンジ・赤系）を廃止し、2026 年版（黄色系）へ完全に置き換える。**
ただし影響範囲は**参加者向け画面に限定する。**

## 配色

下の値は**受領素材から実測したもの**であり、推測ではない。

| トークン | 値 | 由来・用途 |
|---|---|---|
| `--pf-yellow` | `#FCBF01` | `ui/button/button-primary.png` の塗り。**主要ボタン** |
| `--pf-yellow-strong` | `#FCC801` | `icon/nav/nav-home-active.png`。ナビの選択状態 |
| `--pf-yellow-soft` | `#FDD94C` | キャラクターの黄色。装飾・バッジ |
| `--pf-orange` | `#FD6F0D` | `icon/nav/nav-fab-award.png`。FAB・強調 |
| `--pf-cream` | `#FEEAAB` | `background/onboarding-scene.png` の地。**画面背景** |
| `--pf-cream-light` | `#FEF1D0` | 同素材の明るい側 |
| `--pf-surface` | `#FEF8EE` | `bingo/bingo-grid-empty.png`。**カード・パネルの面** |
| `--pf-ink` | `#3B3527` | 線画アイコンの主線。**本文テキスト** |
| `--pf-ink-strong` | `#271603` | ロゴの黒。見出し |
| `--pf-ink-muted` | `#8A8070` | 補助テキスト（`--pf-ink` からの導出値） |

## 置き場所

新規に `src/shared/styles/tokens.scss` を作り、`src/main.tsx` で
**`legacy-app.scss` より先に**読み込む。

```scss
// src/shared/styles/tokens.scss
:root {
  --pf-yellow: #fcbf01;
  --pf-yellow-strong: #fcc801;
  --pf-yellow-soft: #fdd94c;
  --pf-orange: #fd6f0d;

  --pf-cream: #feeaab;
  --pf-cream-light: #fef1d0;
  --pf-surface: #fef8ee;

  --pf-ink: #3b3527;
  --pf-ink-strong: #271603;
  --pf-ink-muted: #8a8070;

  --pf-radius-sm: 0.5rem;
  --pf-radius-md: 0.75rem;
  --pf-radius-lg: 1.25rem;
  --pf-radius-pill: 999px;

  --pf-shadow-card: 0 2px 8px rgb(39 22 3 / 8%);
  --pf-shadow-nav: 0 -2px 12px rgb(39 22 3 / 10%);

  --pf-nav-height: 4.5rem;   // 03-bottom-navigation.md が参照する
}
```

角丸・影・ナビ高さは素材の見た目に合わせた**目安**である。合わなければ調整してよい。
ただし**マジックナンバーを各所に散らさず、必ずこのファイルへ足す。**

## 前年配色の扱い ★重要

`src/shared/styles/legacy-app.scss` の先頭は、前年の色を **Bootstrap の変数へ流し込んでいる。**

```scss
$proto-red: #f84f35;
$proto-orange: #f8730d;
$proto-dark-orange: #f8920d;
$primary: $proto-red;        // ← Bootstrap 全体の primary
$secondary: $proto-dark-orange;

@import 'bootstrap/scss/bootstrap';
```

**ここを書き換えると `/admin` と `/organizer` と `/exhibitor` まで一緒に色が変わる。**
これらは今回の対象外であり、巻き添えで壊してはならない。

### 取る方針

**Bootstrap のグローバル変数（`$primary` / `$secondary`）は今回いじらない。**
代わりに**参加者画面だけをスコープにして上書きする。**

[03-bottom-navigation.md](03-bottom-navigation.md) で作る `ParticipantLayout` が
ルート要素に `.pf-2026` を付ける。参加者向けの色はすべてこの下に閉じる。

```scss
// src/shared/styles/participant-theme.scss
.pf-2026 {
  background: var(--pf-cream-light);
  color: var(--pf-ink);

  .btn-primary {
    --bs-btn-bg: var(--pf-yellow);
    --bs-btn-border-color: var(--pf-yellow);
    --bs-btn-color: var(--pf-ink-strong);
    --bs-btn-hover-bg: var(--pf-yellow-strong);
    // ...
  }
}
```

Bootstrap 5 のボタンは `--bs-btn-*` の CSS 変数で作られているため、
**SCSS を再コンパイルせずスコープ単位で上書きできる。** これを使う。

```
  :root                      … トークン定義（全画面で読めるが、色は当てない）
   └─ .pf-2026               … 参加者画面のみ。ここで初めて色が当たる
        ├─ /home
        ├─ /booth-list
        └─ …
   （.pf-2026 の外＝ /admin, /organizer, /exhibitor は前年配色のまま）
```

### いつ前年の色を消すのか

参加者画面が `.pf-2026` に完全移行し、運営・出展者画面の適用が済んだ後。
**今回の一連の PR では消さない。** `legacy-app.scss` の 1〜5 行目はそのまま残す。

## この PR の範囲

- `tokens.scss` と `participant-theme.scss` を作る
- `main.tsx` から読み込む
- **`.pf-2026` を付ける側（`ParticipantLayout`）はまだ無いので、見た目は変わらない**

`ParticipantLayout` は次の [03](03-bottom-navigation.md) で作る。
この PR は土台だけを置く。

## 完了の条件

- `tokens.scss` / `participant-theme.scss` が存在し、`main.tsx` から読み込まれている
- `npm run build` が通る
- **画面の見た目が PR 前後で変わっていない**（当てる先がまだ無いため）
