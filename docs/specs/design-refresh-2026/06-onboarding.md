---
状態: 確定
最終更新: 2026-08-26
---

# オンボーディング

作業ブランチ: `feat/design/onboarding`

**これは新規機能である。** 見た目の差し替えではない。他の仕様より重い。
**単独で PR を分け、他とまとめない。**

## 現状

**オンボーディング画面は存在しない。** ルートも feature も無い。
近いものとして `HomePage` の「アプリ説明」ボタンが開く `HomeTutorialModal.tsx` があるが、
これはモーダル 1 枚で、アート仕様書が想定する複数ページのスライドではない。

## 構成

横スワイプで進む 4 枚のスライド。各スライドに「スキップ」と「次へ」がある。

| # | 内容 | 主な素材 |
|---|---|---|
| 1 | アプリの機能紹介 | `icon/feature/feature-*.png`（円形アイコン群） |
| 2 | ブースを回ってビンゴを完成させよう | `/onboarding/bingo-flow-steps.png`, `/mascot/mascot-cheering.png` |
| 3 | 会場マップで目的のブースを見つけよう | `/mascot/mascot-with-map.png`, `/icon/feature/feature-floor-map.png` |
| 4 | アワード投票で盛り上がろう | `/onboarding/award-screen-decorated.png` |

共通:

| 用途 | パス |
|---|---|
| 背景 | `/background/onboarding-scene.png` |
| ロゴ | `/brand/logo-protofes.png` |
| 「次へ」の帯 | `/ui/button/bottom-bar-primary.png` |
| スワイプ操作の説明 | `/icon/action/gesture-swipe.png` |

### スマホ枠は代用する

モックでは各スライドにアプリ画面のスマホモックアップが載っているが、
**アワード用（`/onboarding/award-screen-*.png`）以外は素材が無い。**

**全スライドでアワードの画像を代用する。** 新たに画面キャプチャを作らない。

- `/onboarding/award-screen-decorated.png` — 装飾つき
- `/onboarding/award-screen-plain.png` — 装飾なし

同じ絵の装飾あり／なしなので、**スライドごとにどちらかを選んで変化を付けてよい。**
代用であることをコメントに残し、素材受領後に差し替えられるようパスを定数にまとめること。

## 決定事項

| 論点 | 決定 |
|---|---|
| どこで出すか | **新規ルート `/onboarding`** |
| 既読の保存先 | **localStorage。** サーバーには持たない |
| ボトムナビ | **出さない。** `ParticipantLayout` の外に置く |
| `HomeTutorialModal` | **残す。** 「アプリ説明」ボタンからの導線はそのまま |

### 既読を localStorage にする理由

既読フラグは「この端末でもう見た」という UI 都合の状態であり、業務データではない。
サーバー往復なしで初回描画時に判定でき、`event-support-server` の API 契約を
待たずに実装できる。**端末を変えると再表示される**が、オンボーディングでは許容する。

キーは既存の localStorage 利用箇所の命名に揃えること。
`src/shared/lib/` に既に localStorage を触るコードがあるので、先に読んで倣う
（例: `bingoCelebration.ts`）。**新しい流儀を持ち込まない。**

### いつ出すか

**初回ログイン後に自動で 1 回だけ。** 2 回目以降は自動で出さない。
明示的に `/onboarding` を開いた場合は既読でも表示する。

## 実装上の注意

- **スライダーのためにライブラリを増やさない。** CSS の `scroll-snap` で足りる。
  どうしても必要なら理由を書いて相談する
- 背景画像 `onboarding-scene.png` は 941×1672 と大きい。
  画面いっぱいに敷くなら表示サイズと転送量を確認する
- ボトムナビは**出さない。** [03](03-bottom-navigation.md) の `ParticipantLayout` で包まない
- ただし配色は当てるので、ルート要素に `.pf-2026` を自前で付ける（[01](01-design-tokens.md)）
- スワイプできない利用者のために、**「次へ」ボタンだけで最後まで進めること**

## 完了の条件

- 「次へ」だけで最後まで進める。スキップで抜けられる
- 一度見たら次回は自動で出ない（覚え方は決定に従う）
- `npm run test` と `npm run build` が通る
