---
状態: 確定
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

| パス | ページ | 状況 |
|---|---|---|
| `/home` | ホーム（ビンゴ） | 既存 |
| `/booth-list` | ブース一覧 | 既存 |
| `/checkin` | チェックイン | 既存 |
| `/schedule` | スケジュール | 既存 |
| `/award-vote` | アワード投票 | 既存 |
| `/gachapon`, `/gachapon/use`, `/gachapon/complete` | ガチャポン | 既存（準備中表示） |
| `/qa` | Q&A | 既存 |
| `/venue-map` | 会場マップ | **新規**。[07-venue-map.md](07-venue-map.md) |
| `/onboarding` | オンボーディング | **新規**。[06-onboarding.md](06-onboarding.md) |

`/organizer/*` `/admin/*` `/exhibitor` `/pre-survey/*` `/login` `/register` には
**ボトムナビを付けない。画面構成にも手を入れない。**

ただし**配色だけは全画面が対象**である。運営・出展者・主催者画面も
2026 年版の色に変わる（[01-design-tokens.md](01-design-tokens.md)）。

```
  配色          … 全画面が対象
  レイアウト     ┐
  ボトムナビ     ├ 参加者向け画面のみ
  アート素材     ┘
```

### 存在しない機能

デザインのモックには出てくるが、**このリポジトリに実装が無いもの。**
勝手に作らない。扱いは決まっている。

| モックにあるもの | 実装 | 今回の扱い |
|---|---|---|
| 通知ベル | 無し | **仕様から削除。作らない** |
| ヘッダー（ロゴ+ベル+≡） | 無し | **作らない**。スクロールを要する画面が無いため |
| メニュー画面 | 無し | **作らない**。ナビにも載せない |
| つぶやき（投稿・一覧） | 無し | **ボタンだけ作る**。[08-tweets-placeholder.md](08-tweets-placeholder.md) |
| ブースマーカー | 無し | **不要**。会場マップは画像を出すだけ |

### スタイルの現状

グローバル SCSS は `src/main.tsx` が 2 本読み込んでいる。

- `src/shared/styles/legacy-app.scss` — Bootstrap 変数の上書き + 少量の共通クラス
- `src/shared/styles/legacy-participant-pages.scss` — 参加者ページの寄せ集め（500行）

feature 固有のものは各 feature の `styles/` に置き、ページ側で import している
（例: `src/features/home/styles/legacy-home.scss`）。

**`legacy-` 接頭辞は「前年から持ち越した未整理のスタイル」を意味する。**
新しく書くファイルにこの接頭辞を付けない。

現状の色は前年のオレンジ／赤系（`$proto-red: #f84f35` 等）で、2026 年版の黄色系とは合わない。
**この 3 変数は `legacy-app.scss` の 1〜5 行目でしか使われておらず**、
そこから Bootstrap の `$primary` / `$secondary` に流し込まれて全画面に効いている。
→ [01-design-tokens.md](01-design-tokens.md)

`src/features/admin/` `organizer/` `exhibitor/` には**SCSS/CSS ファイルが無い。**
Bootstrap のクラスで組まれているため、上の 1 箇所を直せば配色は一括で切り替わる。

### ガチャは準備中

ガチャ機能は準備中表示になっている（コミット `fe8dc8b`）。
**ガチャ画面の作り込みはこの仕様の範囲外。**

ただし**ガチャコインの最大所有枚数は 4 枚**であり、この値は
[04-home-and-bingo.md](04-home-and-bingo.md) の進捗ステッパーが参照する。
現状この 4 は 2 箇所にべた書きされている。

- `src/shared/data/sample/SampleEventData.ts:52` — `Math.min(4, ...)`
- `src/features/home/pages/HomePage/HomeTutorialModal.tsx:14` — 「最大4枚まで」の文言

**ステッパー実装時に共有定数へ切り出し、3 箇所目を増やさないこと。**

## 進め方の作法

- **1 PR = 1 目的。** [README.md](README.md) の作業単位を守る
- コミットメッセージ・PR は**日本語**。形式は `種別(範囲): 要約`
- 既存の挙動を変えない。**これは見た目の差し替えであって、機能追加ではない**
  （例外は [03](03-bottom-navigation.md) のナビと [06](06-onboarding.md) のオンボーディング）
- 既存テストを壊さない。`npm run test` と `npm run build` が通ることを PR 前に確認する
- **迷ったら止めて聞く。** この仕様に未決定の項目は残していない。
  書かれていないことを推測で埋めるくらいなら、手を止めて確認する
