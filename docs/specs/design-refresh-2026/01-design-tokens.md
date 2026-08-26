---
状態: 草案
最終更新: 2026-08-26
---

# デザイントークン

作業ブランチ: `feat/design/tokens`

## やること

2026 年版の配色を **CSS カスタムプロパティ**として一箇所に定義し、
以降の実装がそれを参照するようにする。**この PR では見た目を変えない。**
トークンを追加するだけで、既存クラスの書き換えは後続 PR で行う。

## 配色

下の値は**受領素材から実測したもの**であり、推測ではない。

| トークン | 値 | 由来・用途 |
|---|---|---|
| `--pf-yellow` | `#FCBF01` | `ui/button/button-primary.png` の塗り。**主要ボタン** |
| `--pf-yellow-strong` | `#FCC801` | `icon/nav/nav-home-active.png`。ナビの選択状態 |
| `--pf-yellow-soft` | `#FDD94C` | キャラクターの黄色。装飾・バッジ |
| `--pf-orange` | `#FD6F0D` | `icon/nav/nav-fab-award.png`。中央 FAB・強調 |
| `--pf-cream` | `#FEEAAB` | `background/onboarding-scene.png` の地。**画面背景** |
| `--pf-cream-light` | `#FEF1D0` | 同素材の明るい側。背景のグラデ下側 |
| `--pf-surface` | `#FEF8EE` | `bingo/bingo-grid-empty.png`。**カード・パネルの面** |
| `--pf-ink` | `#3B3527` | 線画アイコンの主線。**本文テキスト** |
| `--pf-ink-strong` | `#271603` | ロゴの黒。見出し |
| `--pf-ink-muted` | `#8A8070` | 補助テキスト（`--pf-ink` から導出。**要判断**） |

> **要判断**：`--pf-ink-muted` だけは素材に実測の根拠が無く、こちらで置いた暫定値である。
> デザイン担当の確認を取ること。

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
}
```

角丸・影の値は素材の見た目に合わせた**目安**である。実装しながら合わなければ調整してよい。
ただし**マジックナンバーを各所に散らさず、必ずこのファイルへ足す。**

## 既存の色との関係

`src/shared/styles/legacy-app.scss` の先頭にある前年の色は**この PR では消さない。**

```scss
$proto-red: #f84f35;      // 前年。まだ多くの箇所が参照している
$proto-orange: #f8730d;
$proto-dark-orange: #f8920d;
```

これらは Bootstrap の `$primary` / `$secondary` に流し込まれており、
今消すと参加者画面以外（`/admin`・`/organizer`）まで巻き添えで変わる。
**参加者画面の書き換えが全部終わってから、最後にまとめて片付ける。**

## 完了の条件

- `src/shared/styles/tokens.scss` が存在し、`main.tsx` から読み込まれている
- `npm run build` が通る
- **画面の見た目が PR 前後で変わっていない**（トークンを定義しただけなので）
