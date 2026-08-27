---
状態: 確定
最終更新: 2026-08-26
---

# デザイントークンと配色の全面置き換え

作業ブランチ: `feat/design/tokens`

## やること

**前年の配色（オレンジ・赤系）を廃止し、2026 年版（黄色系）へ全画面で置き換える。**
参加者画面だけでなく、**運営・出展者・主催者画面も同時に切り替える。**

## 一括で切り替えられる根拠

調査済みの事実。**この前提が崩れていないか着手時に確認すること。**

1. 前年の色変数 `$proto-red` / `$proto-orange` / `$proto-dark-orange` は
   **`src/shared/styles/legacy-app.scss` の 1〜5 行目でしか使われていない。**
   ここから Bootstrap の `$primary` / `$secondary` に流し込まれ、
   全画面へ効いている。**つまり 1 箇所を直せば全体が変わる**

   ```bash
   # 参照が他に無いことの確認
   grep -rn "proto-red\|proto-orange\|proto-dark-orange" src
   ```

2. `src/features/admin/` `organizer/` `exhibitor/` に
   **SCSS/CSS ファイルが 1 つも無い。** Bootstrap のクラスで組まれている

## 配色

下の値は**受領素材から実測したもの**であり、推測ではない。

| トークン | 値 | 由来・用途 |
|---|---|---|
| `--pf-yellow` | `#FCBF01` | `ui/button/button-primary.png` の塗り。**主要ボタン** |
| `--pf-yellow-strong` | `#FCC801` | `icon/nav/nav-home-active.png`。ホバー・選択状態 |
| `--pf-yellow-soft` | `#FDD94C` | キャラクターの黄色。装飾・バッジ |
| `--pf-orange` | `#FD6F0D` | `icon/nav/nav-fab-award.png`。FAB・強調 |
| `--pf-cream` | `#FEEAAB` | `background/onboarding-scene.png` の地 |
| `--pf-cream-light` | `#FEF1D0` | 同素材の明るい側。**参加者画面の背景** |
| `--pf-surface` | `#FEF8EE` | `bingo/bingo-grid-empty.png`。**カード・パネルの面** |
| `--pf-ink` | `#3B3527` | 線画アイコンの主線。**本文テキスト** |
| `--pf-ink-strong` | `#271603` | ロゴの黒。見出し |
| `--pf-ink-muted` | `#6E6656` | 補助テキスト（`--pf-ink` からの導出値。**コントラスト検証済み**） |

## 手順

### 1. トークンを定義する

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
  --pf-ink-muted: #6e6656;

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

### 2. Bootstrap の変数を差し替える

`src/shared/styles/legacy-app.scss` の先頭を書き換える。**ここが全画面に効く 1 箇所。**

```scss
// 変更前
$proto-red: #f84f35;
$proto-orange: #f8730d;
$proto-dark-orange: #f8920d;
$primary: $proto-red;
$secondary: $proto-dark-orange;

// 変更後
$pf-yellow: #fcbf01;
$pf-orange: #fd6f0d;
$primary: $pf-yellow;
$secondary: $pf-orange;
```

**SCSS 変数と CSS カスタムプロパティで値が二重管理になる。**
Bootstrap は `@import` 時に SCSS 変数を必要とするため、`var()` を渡せない。
この重複は避けられない。**同じ値であることをコメントで明記し、片方だけ直さないこと。**

```scss
// tokens.scss の --pf-yellow と同じ値。両方セットで直すこと
$pf-yellow: #fcbf01;
```

### 3. コントラストをテストで担保する

`$primary` が黄色になるため、**文字色が読めるかどうかが最大のリスク**である。
目視だけに頼らず、**自動テストで落とす。**

#### 検証済みの実測値

計算済みのコントラスト比。**この表を満たすことをテストで固定する。**

| 前景 | 背景 | 比 | 判定 |
|---|---|---|---|
| `--pf-ink-strong` | `--pf-yellow` | 10.47 | ✅ 主要ボタンの文字はこれ |
| `--pf-ink` | `--pf-yellow` | 7.30 | ✅ |
| `--pf-ink-strong` | `--pf-orange` | 6.20 | ✅ |
| `--pf-ink` | `--pf-cream-light` | 10.85 | ✅ 本文 |
| `--pf-ink` | `--pf-surface` | 11.53 | ✅ カード上の本文 |
| `--pf-ink-muted` | `--pf-surface` | 5.37 | ✅ 補助テキスト |
| `--pf-ink-muted` | `--pf-cream-light` | 5.06 | ✅ |
| `--pf-ink-muted` | `--pf-cream` | 4.75 | ✅ |
| **白** | `--pf-yellow` | **1.67** | ❌ **絶対に作ってはいけない組み合わせ** |
| **白** | `--pf-orange` | **2.82** | ❌ **同上** |

> `--pf-ink-muted` は当初 `#8A8070` としていたが、**AA 基準（4.5）を満たさなかった**
> （3.68 / 3.46 / 3.25）。`#6E6656` へ補正済み。**元の値へ戻さないこと。**

#### テストを書く

`tests/unit/design-tokens.test.ts` を新規に追加する。
テスト環境は `environment: 'node'` で jsdom が無いため、**描画せず値を検証する。**

**トークンの値を TS 側にコピーしない。** 三重管理になる。
`src/shared/styles/tokens.scss` を `node:fs` で読み、`--pf-*` を正規表現で抜き出す。
**SCSS ファイルそのものを検証対象にする。**

テストに書くこと:

1. 上の表の ✅ の組がすべて **4.5 以上**であること
2. **白 × `--pf-yellow` と 白 × `--pf-orange` が 4.5 未満であること**
   （[rules/testing.md](../../rules/testing.md)「起きてはいけないことを書く」）
   — この 2 つが 4.5 を超えたら、それはトークンが書き換わった証拠なので落とす
3. `legacy-app.scss` の `$pf-yellow` / `$pf-orange` が
   `tokens.scss` の `--pf-yellow` / `--pf-orange` と**同じ値**であること
   — 手順 2 の二重管理が壊れたことを検知する

コントラスト比は WCAG 2.1 の定義で計算する（相対輝度 → `(L1+0.05)/(L2+0.05)`）。
計算関数は `tests/unit/` 内に置き、`src/` へは入れない（本番コードで使わないため）。

#### 実装で守ること

- **`.btn-primary` の文字色を暗色に固定する。**
  Bootstrap 5 の `color-contrast()` は通常正しく暗色を選ぶが、
  依存せず `--bs-btn-color: var(--pf-ink-strong)` を明示する
- ホバー・アクティブ・`disabled` の各状態でも文字色を明示する。
  **状態によって白文字に戻る**のがよくある事故である

#### 目視で確かめること

テストは色の値しか見ない。**実物でしか分からないものは自分の目で確認する。**

- 参加者・運営・出展者・主催者の各画面でボタンの文字が読めるか
- `btn-outline-primary` の枠線と文字が背景から浮くか
- フォーカスリングが黄色背景の上で見えるか

#### 記録を残す

テストを追加したら [docs/tests/runs/_template.md](../../tests/runs/_template.md) に沿って
`docs/tests/runs/` に実行記録を残す（[rules/testing.md](../../rules/testing.md)）。

## 運営・出展者・主催者画面

**上の 2 の変更だけでボタン・リンク・バッジが自動的に切り替わる。**
個別の書き換えは基本的に不要。ただし次のべた書きが残る。

| 箇所 | 値 | 扱い |
|---|---|---|
| `admin/components/AdminShell.tsx:36` | `#f8f9fa` | 画面背景。**`--pf-cream-light` に変える** |
| `organizer/components/OrganizerShell.tsx:25` | `#f8f9fa` | 同上 |
| `exhibitor/pages/ExhibitorDashboardPage.tsx:128` | `#f8f9fa` | 同上 |
| `exhibitor/pages/ExhibitorDashboardPage.tsx:259` | `#f8730d` | **前年オレンジのべた書き。`--pf-orange` に変える** |
| `admin/pages/DashboardPage.tsx` ほか analytics 系 | `#0d6efd` `#198754` `#fd7e14` 等 | **グラフ・指標の色。触らない**（下記） |

### グラフの色は触らない

`admin/windows/*.tsx` と `DashboardPage.tsx` にある色は
**統計グラフの系列色**であり、ブランド色ではない。
系列同士が識別できることが優先で、黄色系に揃えると**判別できなくなる。**

**今回は現状維持とする。** 配色を整えるなら別途デザインの検討が要る。

## 参加者画面のべた書き

参加者向け SCSS には前年の色が大量に残っている。**これが作業の本体である。**

| ファイル | 件数 |
|---|---|
| `src/shared/styles/legacy-participant-pages.scss` | 63 |
| `src/features/home/styles/legacy-home.scss` | 40 |
| `src/features/home/styles/bingo-card.scss` | 18 |
| `src/features/booth/styles/legacy-booth-list.scss` | 9 |

**この PR ではまだ触らない。** それぞれ後続の PR で、担当箇所を書き換えるときに
`var(--pf-*)` へ寄せる。一度に全部やるとレビューできない大きさになる。

- `bingo-card.scss` / `legacy-home.scss` → [04](04-home-and-bingo.md)
- `legacy-participant-pages.scss` → [04](04-home-and-bingo.md) と [05](05-modals.md) で分担
- `legacy-booth-list.scss` → [03](03-bottom-navigation.md) のブース一覧対応時

## この PR の範囲

- `tokens.scss` を作り `main.tsx` から読み込む
- `legacy-app.scss` の Bootstrap 変数を差し替える
- 3 つのシェルの `#f8f9fa` と出展者グラフの `#f8730d` を置き換える

**見た目は全画面で変わる。** それが目的である。

## 完了の条件

- `grep -rn "proto-red\|proto-orange\|proto-dark-orange" src` が **0 件**
- `tests/unit/design-tokens.test.ts` があり、上の表を満たしている
- `docs/tests/runs/` に実行記録がある
- 参加者・運営・出展者・主催者の各画面を開き、
  **ボタンの文字が読める**（黄色地に白文字になっていない）
- 統計グラフの系列が従来どおり識別できる
- `npm run test` と `npm run build` が通る
