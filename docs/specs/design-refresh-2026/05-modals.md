---
状態: 確定
最終更新: 2026-09-28
---

# 完了ポップアップ・モーダル

作業ブランチ: `feat/design/modals`

**前提**：[01](01-design-tokens.md) が終わっていること。[03](03-bottom-navigation.md) とは独立。

## 素材の性質

`feedback/` の 3 枚は**ポップアップの中身のイラスト（見出し文込み）**である。
**ボタンは含まれていない。** ボタンは UI 側で組む。

| パス | 出す場面 |
|---|---|
| `/feedback/popup-bingo-complete.png` | 全ビンゴ達成 |
| `/feedback/popup-coin-complete.png` | 全ガチャコイン獲得 |
| `/feedback/popup-vote-complete.png` | 投票完了 |

補助素材:

| パス | 用途 |
|---|---|
| `/icon/action/close.png` | 閉じる（円形背景つき） |
| `/icon/status/warning.png` | 警告（透過） |
| `/icon/status/warning-opaque.png` | 警告（白背景。透過が使えない場面のみ） |
| `/mascot/mascot-cheering.png` | 喜ぶキャラ |
| `/bingo/bingo-grid-filled.png` | 盤が全部埋まった一枚絵 |

**見出し文が画像に焼き込まれている点に注意。** 同じ文言を HTML でも書くと二重に出る。
ただし**画像だけにするとスクリーンリーダーに何も伝わらない。**
画像の `alt` に文言を入れるか、視覚的に隠したテキスト（`.visually-hidden`）を併置すること。

## 現状のモーダル

`HomePage.tsx` に素の実装が 2 つある（`.modal-overlay` / `.modal-content`）。

- ビンゴ達成モーダル（`bingoModalOpen`）— 現状 `🎉 BINGO! 🎉` の絵文字
- アンケート確認モーダル（`feedbackConfirmOpen`）

`BingoCardView.tsx` にもブース詳細モーダルがある。
スタイルは `legacy-participant-pages.scss` に散らばっている。

### 共通部品にする

同じ `.modal-overlay` / `.modal-content` の組を各所で手書きしている。
**この PR で共通のモーダル部品へ寄せる。**

```
src/shared/components/modal/
├── Modal.tsx          # overlay + content の外枠、閉じる操作
└── modal.scss
```

[03](03-bottom-navigation.md) で `src/shared/components/` を作っているなら、その下に並べる。
まだ無ければここで作る。作ったら
[reference/directory-structure.md](../../reference/directory-structure.md) に追記する。

**アクセシビリティは現状の実装を後退させない。** 既に
`role="dialog"` `aria-modal="true"` `aria-labelledby` が付いている。共通部品でも維持する。
加えて Esc で閉じられること、開いている間に背後がフォーカスを取らないことを満たす。

## 差し替え対象

| 場所 | 現状 | 2026 年版 |
|---|---|---|
| `HomePage.tsx` ビンゴ達成モーダル | 絵文字 `🎉 BINGO! 🎉` | `popup-bingo-complete.png` |
| 投票完了 | `AwardVotePage.tsx` の完了表示 | `popup-vote-complete.png` |
| 全コイン獲得 | 該当する状態がフロントに無い | `popup-coin-complete.png`（`GET /gacha/coins` の上限到達で出す） |

投票完了の表示は `src/features/award/pages/AwardVotePage.tsx` にある。
着手前にこのファイルを読み、既存の完了表示を差し替えること。

## ビンゴ達成モーダルとコイン満タンモーダル

- **ビンゴ達成モーダルは `popup-bingo-complete.png` を常に出す。** 出す・出さないを本数や
  他機能の状態で切り替えない。文言は成立本数を出す（`ビンゴがn本そろいました！`）
- **表示判定はビンゴのデータ（カードの `lines_completed`）で行う。** ガチャコインを見てはならない
  （server `docs/specs/gacha-and-award/README.md`「絶対に守る依存の向き」: `ガチャ → ビンゴ` は禁止）
- `popup-coin-complete.png` のモーダルは残すが、**アート付きモーダルを2枚続けない。**
  同じ来訪でビンゴ達成モーダルを出したときは、コイン満タン側はアートを出さず文言だけにする
  （4本目のビンゴでは両方が同時に成立する）
- コイン満タンは端末ごとに1回だけ（`src/shared/lib/coinCelebration.ts`）

## 完了の条件

- 共通モーダル部品ができ、既存 3 箇所がそれを使っている
- Esc で閉じられ、読み上げでポップアップの内容が伝わる
- 既存テストが通る（`npm run test`）
- `npm run build` が通る
