---
状態: 草案
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

## アート仕様書が想定する構成

横スワイプで進む 4〜5 枚のスライド。各スライドに「スキップ」と「次へ」がある。

| # | 内容 | 主な素材 |
|---|---|---|
| 1 | アプリの機能紹介 | `icon/feature/feature-*.png`（円形アイコン群） |
| 2 | ブースを回ってビンゴを完成させよう | `/onboarding/bingo-flow-steps.png`, `/mascot/mascot-cheering.png` |
| 3 | 会場マップで目的のブースを見つけよう | `/mascot/mascot-with-map.png`, `icon/feature/feature-floor-map.png` 他 |
| 4 | アワード投票で盛り上がろう | `/onboarding/award-screen-decorated.png` |

共通:

| 用途 | パス |
|---|---|
| 背景 | `/background/onboarding-scene.png` |
| ロゴ | `/brand/logo-protofes.png` |
| 「次へ」の帯 | `/ui/button/bottom-bar-primary.png` |
| スワイプ操作の説明 | `/icon/action/gesture-swipe.png` |

`/onboarding/award-screen-decorated.png` と `/onboarding/award-screen-plain.png` は
**同じ絵の装飾あり／なし**である。どちらか一方だけ使う。

## 決まっていないこと（要判断）

**着手前にすべて決めること。実装者が決めない。**

1. **どこで出すか。** ルートを新設するのか（例 `/onboarding`）、
   既存の `HomeTutorialModal` を置き換えるのか
2. **いつ出すか。** 初回ログイン後に自動で出すのか、明示的に開いたときだけか
3. **出し終わったことをどう覚えるか。** localStorage か、サーバー側に持つのか。
   サーバーに持つなら `event-support-server` の API 契約が要る
   （[rules/documentation.md](../../rules/documentation.md)「仕様はデータを持つ側に置く」）
4. **スライドの枚数と文言。** 画像に焼き込まれた文言と HTML の文言の切り分け
5. `HomeTutorialModal` を残すのか消すのか

3 がサーバー依存になる場合、**このリポジトリだけでは完結しない。**
先に `event-support-server` 側の仕様を確認すること。

## 実装上の注意

- **スライダーのためにライブラリを増やさない。** CSS の `scroll-snap` で足りる。
  どうしても必要なら理由を書いて相談する
- 背景画像 `onboarding-scene.png` は 941×1672 と大きい。
  画面いっぱいに敷くなら表示サイズと転送量を確認する
- ボトムナビは**出さない。** [03](03-bottom-navigation.md) の `ParticipantLayout` で包まない
- スワイプできない利用者のために、**「次へ」ボタンだけで最後まで進めること**

## 完了の条件

- 上の「決まっていないこと」がすべて確定してから着手している
- 「次へ」だけで最後まで進める。スキップで抜けられる
- 一度見たら次回は自動で出ない（覚え方は決定に従う）
- `npm run test` と `npm run build` が通る
