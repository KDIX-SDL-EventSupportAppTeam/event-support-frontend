---
状態: 確定
最終更新: 2026-08-26
---

# ボトムナビゲーションと参加者レイアウト

作業ブランチ: `feat/design/bottom-nav`

**この仕様は見た目の差し替えではなく、新規の構造追加である。** 影響範囲が広い。
[00-context.md](00-context.md)「参加者画面にレイアウト共通部品が無い」を先に読むこと。

## 構成（確定）

```
┌───────────────────────────────────────┐
│                                       │
│            （ページ本体）              │
│                                       │
├────────┬────────┬──────┬───────┬──────┤
│        │        │  ◯   │       │      │  ← 中央だけ円形に飛び出す
│ ホーム │ブース  │チェッ│スケジ │アワー│
│        │一覧    │クイン│ュール │ド投票│
└────────┴────────┴──────┴───────┴──────┘
  /home   /booth-  /checkin /schedule /award-
          list      (FAB)             vote
```

**ヘッダーは作らない。** 通知ベル・ハンバーガー・メニュー画面も**作らない。**
スクロールを要するほどの情報量が無いため、上部は各ページに任せる。

会場マップ（[07](07-venue-map.md)）とつぶやき（[08](08-tweets-placeholder.md)）は
**ナビに載せない。** ホーム画面からの導線とする。

## 使う素材

| 位置 | 素材 |
|---|---|
| バーの背景 | `/ui/nav/nav-bar-notched.png` |
| ホーム（非選択 / 選択中） | `/icon/nav/nav-home.png` / `/icon/nav/nav-home-active.png` |
| ブース一覧 | `/icon/nav/nav-map.png` |
| スケジュール | `/icon/nav/nav-schedule.png` |
| アワード投票 | `/icon/nav/nav-fab-award.png` を非 FAB 用に縮小、または `/icon/feature/feature-award.png` |
| 中央 FAB（チェックイン） | `/icon/nav/nav-fab-checkin.png` |

**使わない素材**（このナビ構成では出番が無い。消さずに `public/` に残す）:

- `/icon/nav/nav-set-home-checkin-guide.png` — 3項目の合成画像。押下領域を分けられない
- `/icon/nav/nav-guide.png` — 参加ガイドはナビに載せない
- `/icon/action/menu.png` — メニュー画面を作らない

各アイコン素材には**ラベル文字（「ホーム」等）が焼き込まれている。**
テキストを別途重ねると二重になる。**画像をそのまま置き、テキストは足さない。**
その代わり `alt` とスクリーンリーダー向けのラベルは必ず付ける。

`/icon/nav/nav-bar-flat.png`（影なし）は影ありで問題が出たときの予備。通常は使わない。

## 実装の形

### 置き場所

`src/shared/` に共有 UI 部品の置き場が無いので新設する。

```
src/shared/components/layout/
├── ParticipantLayout.tsx      # 参加者画面の外枠
├── BottomNav.tsx              # ナビ本体
└── bottom-nav.scss
```

`src/shared/components/` は**このリポジトリで初めて作るディレクトリ**である。
作ったら [reference/directory-structure.md](../../reference/directory-structure.md) に追記すること。

### ParticipantLayout の責務

1. `<BottomNav />` を描画する
2. 本体に `padding-bottom: var(--pf-nav-height)` を持たせ、ナビの下に潜り込ませない
3. `env(safe-area-inset-bottom)` を加味する（iOS の下端ジェスチャーバー対策）
4. 参加者画面の背景 `--pf-cream-light` を敷く

```tsx
<div className="participant-layout">
  <main className="participant-layout__body"><Outlet /></main>
  <BottomNav />
</div>
```

**配色のスコープ用クラスは不要である。** [01](01-design-tokens.md) で
Bootstrap の変数ごと差し替えるため、色は全画面に既に効いている。
`ParticipantLayout` が持つのは**レイアウトの責務だけ。**

### ルーターへの適用

`src/router/index.tsx` で、参加者向けルートをレイアウトルートで包む。
**個別ページに `<BottomNav />` を書いて回らない。**

対象は [00-context.md](00-context.md)「参加者向けルート」の表にあるパス。
`/organizer/*` `/admin/*` `/exhibitor` `/pre-survey/*` `/login` `/register` には**付けない。**

`/onboarding` は参加者向けだが**ナビを出さない。** レイアウトの外に置く。

### 選択状態

`react-router-dom` の `NavLink` を使い、現在パスと一致する項目を
`nav-home-active.png` 側に差し替える。**選択状態を自前の state で持たない。**

## HomePage のボタングリッドを消す

ナビが入ると `HomePage.tsx` のボタングリッドは同じ導線の重複になる。

**削除する 4 ボタン**（`.action-button`）:

- ブース一覧 / チェックイン / スケジュール / アワード投票

**残すもの**:

| 要素 | 理由 |
|---|---|
| ガチャポンボタン | ナビに載らない |
| 会場マップへの導線 | [07](07-venue-map.md) で追加する |
| つぶやきボタン | [08](08-tweets-placeholder.md) で追加する |
| 「イベントアンケートに回答する」 | `survey_url` 設定時のみ表示。ナビに載らない |
| アプリ説明 / Q&A / アプリフィードバック | 下段の副導線。ナビに載らない |

削除に伴い `legacy-home.scss` の `.action-button` 系や `legacy-app.scss` の
`.action-button` が未使用になる可能性がある。
**使われなくなったスタイルは同じ PR で消す。** ただし `legacy-app.scss` の
`.action-button` は他画面が使っていないか確認してから消すこと。

[02](02-legacy-asset-cleanup.md) で `/legacy/` 参照に直した 4 件は、
この PR でボタンごと消える。**`public/legacy/icons/` のファイル自体は消さない。**

## 完了の条件

- 参加者向けルートすべてでナビが出て、管理・主催者・出展者・認証・オンボーディングでは出ない
- 現在地の項目が選択状態になる
- 各ページの一番下のコンテンツがナビに隠れない
- キーボード操作でナビ項目に到達でき、読み上げでラベルが分かる
- `npm run test` と `npm run build` が通る
