---
状態: 草案
最終更新: 2026-08-26
---

# 前提と現状

**実装を始める前に必ずこのファイルを読むこと。**

## まず読むもの

| 文書 | なぜ |
|---|---|
| [AGENTS.md](../../../AGENTS.md) | このリポジトリの作業指針。**最優先** |
| [rules/coding.md](../../rules/coding.md) | コーディング規約 |
| [rules/git.md](../../rules/git.md) | ブランチ・コミット・PR の作法（**日本語で書く**） |
| [rules/testing.md](../../rules/testing.md) | テストの方針 |
| [reference/assets.md](../../reference/assets.md) | **アート素材の一覧と命名。参照パスはここが正本** |
| [reference/directory-structure.md](../../reference/directory-structure.md) | `src/` の構成 |

## 技術スタック

React + TypeScript + Vite + React Router + Zustand + SCSS + Bootstrap 5（`bootstrap-icons` 併用）。
テストは Vitest。パスエイリアスは `@/` → `src/`。

## アセットの参照方法

素材は `public/` 配下にある。**Vite の `public/` なので絶対パスで参照し、`public/` を含めない。**

```tsx
<img src="/mascot/mascot-with-gavel.png" alt="" />   // ○
<img src="/public/mascot/..." />                      // ×
import x from '@/../public/...'                       // ×
```

利用できる素材の一覧・用途は [reference/assets.md](../../reference/assets.md) にある。
**そこに無い素材を勝手に作らない。** 必要になったら実装を止めて相談する。

## 現状のコード（2026-08-26 時点）

ここを誤解すると設計を間違えるので、事実を書いておく。

### 参加者画面にレイアウト共通部品が無い

`src/App.tsx` は `AppRoutes` を `<div id="app-container">` で包むだけ。
**ヘッダーもボトムナビも存在しない。** 各ページが個別に自前で組んでいる。

```tsx
// src/App.tsx（全文）
export default function App() {
  return (
    <div id="app-container">
      <AppRoutes />
    </div>
  )
}
```

`src/shared/` に `components/` ディレクトリ自体が無い。共有 UI 部品は今ゼロである。

### 画面遷移はホームのボタングリッド

現状の `HomePage` は、ビンゴカードの下に 2 列のボタングリッドを並べて
ブース一覧 / チェックイン / スケジュール / アワード投票へ飛ばしている
（`src/features/home/pages/HomePage/HomePage.tsx`）。
**2026 年版デザインではここがボトムナビに置き換わる。** → [03-bottom-navigation.md](03-bottom-navigation.md)

### 参加者向けルート

`src/router/index.tsx` に定義済み。ボトムナビの対象になるのは次の範囲。

| パス | ページ |
|---|---|
| `/home` | ホーム（ビンゴ） |
| `/booth-list` | ブース一覧 |
| `/checkin` | チェックイン |
| `/schedule` | スケジュール |
| `/award-vote` | アワード投票 |
| `/gachapon`, `/gachapon/use`, `/gachapon/complete` | ガチャポン |
| `/qa` | Q&A |

`/organizer/*` `/admin/*` `/pre-survey/*` `/login` `/register` は**対象外**。触らない。

### スタイルの現状

グローバル SCSS は `src/main.tsx` が 2 本読み込んでいる。

- `src/shared/styles/legacy-app.scss` — Bootstrap 変数の上書き + 少量の共通クラス
- `src/shared/styles/legacy-participant-pages.scss` — 参加者ページの寄せ集め（500行）

feature 固有のものは各 feature の `styles/` に置き、ページ側で import している
（例: `src/features/home/styles/legacy-home.scss`）。

**`legacy-` 接頭辞は「前年から持ち越した未整理のスタイル」を意味する。**
新しく書くファイルにこの接頭辞を付けない。

現状の色は前年のオレンジ／赤系（`$proto-red: #f84f35` 等）で、
2026 年版の黄色系とは合わない。→ [01-design-tokens.md](01-design-tokens.md)

### ガチャは準備中

ガチャ機能は準備中表示になっている（コミット `fe8dc8b`）。
**ガチャ画面の作り込みはこの仕様の範囲外。** `public/gacha/coin.png` は
ビンゴ達成ポップアップ側で使う可能性があるだけである。

## 進め方の作法

- **1 PR = 1 目的。** [README.md](README.md) の作業単位を守る
- コミットメッセージ・PR は**日本語**。形式は `種別(範囲): 要約`
- 既存の挙動を変えない。**これは見た目の差し替えであって、機能追加ではない**
  （例外は [03](03-bottom-navigation.md) のナビと [06](06-onboarding.md) のオンボーディング）
- 既存テストを壊さない。`npm run test` と `npm run build` が通ることを PR 前に確認する
- **迷ったら止めて聞く。** 「要判断」と書かれた箇所を自分で決めない
