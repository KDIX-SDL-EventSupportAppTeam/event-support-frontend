---
状態: 確定
最終更新: 2026-08-26
---

# 会場マップ

作業ブランチ: `feat/design/venue-map`

**前提**：[03](03-bottom-navigation.md) が終わっていること。

## 範囲 ★重要

**単純な画像表示に留める。** これ以上のことをしない。

```
  やる                          やらない
  ────────                      ──────────
  会場マップ画像を1枚出す       ブースマーカーの配置
  拡大・縮小して見られる        現在地の表示
  ホームからの導線              ルート案内・次のブースへの誘導
                                ブース座標データの設計
                                サーバーとの通信
```

ブースマーカーは**不要**と決定した。地図を出すだけでよい。

## 画像は代用

**2026 年版の会場マップ素材はまだ届いていない。**
暫定で `/bingo/bingo-grid-empty.png` を代用する。

```tsx
// 差し替え時に1箇所直せば済むよう、パスを定数にする
const VENUE_MAP_IMAGE = '/bingo/bingo-grid-empty.png' // TODO: 会場マップ素材の受領後に差し替え
```

**`alt` は「会場マップ」とし、代用中であることをコメントで残す。**
素材が届いたら `public/map/venue-map.png` として置き、この定数だけを直す。

## 実装の形

```
src/features/venue-map/
└── pages/
    └── VenueMapPage.tsx
```

`src/features/` の他の feature と同じ構成に揃える
（[reference/directory-structure.md](../../reference/directory-structure.md)）。

ルートは `/venue-map`。`src/router/index.tsx` に追加し、
[03](03-bottom-navigation.md) の `ParticipantLayout` の下に置く（ナビを出す）。

**ボトムナビには載せない。** ナビは 5 項目で確定している。
`HomePage` から導線を張る。既存の副導線ボタンと同じ見た目でよい。

`/icon/feature/feature-floor-map.png` をボタンのアイコンに使える。

## 認証

他の参加者ページと同じガードを掛けること。
`src/router/index.tsx` の `/booth-list` や `/schedule` の書き方に倣う。
**独自のガードを新しく作らない。**

## 完了の条件

- `/venue-map` が開き、画像が 1 枚表示される
- ホームから `/venue-map` へ遷移できる
- ボトムナビが出る（項目としては載らない）
- 未認証で開けない（他の参加者ページと同じ挙動）
- `npm run test` と `npm run build` が通る
