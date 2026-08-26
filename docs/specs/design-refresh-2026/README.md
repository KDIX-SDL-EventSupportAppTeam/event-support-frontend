---
状態: 草案
最終更新: 2026-08-26
---

# 2026年版デザイン適用

**目的。** 受領した 2026 年版アート素材を参加者向け画面へ適用し、前年の暫定 UI を置き換える。

**この文書群は別セッションの実装者（Claude Code）への指示書である。** 実装に入る前に
まず [00-context.md](00-context.md) を読むこと。リポジトリの前提と現状がそこに書いてある。

## 状態について

**この仕様はまだ「草案」である。** [rules/documentation.md](../../rules/documentation.md) の
とおり、**確定していない仕様は実装しない。** 各ファイル冒頭の状態が「確定」に
変わってから着手すること。「要判断」と書かれた箇所は勝手に決めない。

## ファイル

| ファイル | 内容 |
|---|---|
| [00-context.md](00-context.md) | 前提・現状のコード・ブランチ運用・共通の作法 |
| [01-design-tokens.md](01-design-tokens.md) | 配色・角丸・トークンの置き場 |
| [02-legacy-asset-cleanup.md](02-legacy-asset-cleanup.md) | `legacy/` 退避で壊れた参照の解消 |
| [03-bottom-navigation.md](03-bottom-navigation.md) | ボトムナビ（新規）と参加者レイアウト |
| [04-home-and-bingo.md](04-home-and-bingo.md) | ホーム画面・ビンゴ盤の見た目 |
| [05-modals.md](05-modals.md) | 完了ポップアップ・モーダル |
| [06-onboarding.md](06-onboarding.md) | オンボーディング（新規画面） |

## 作業の分け方

統合ブランチ `integration/2026-08-design-refresh` から作業ブランチを生やし、
**統合ブランチへ PR を出す。** `develop` へ直接出さない。

| 順 | 作業ブランチ | 対応する仕様 |
|---|---|---|
| 1 | `feat/design/tokens` | 01 |
| 2 | `fix/design/legacy-asset-paths` | 02 |
| 3 | `feat/design/bottom-nav` | 03 |
| 4 | `feat/design/home-bingo` | 04 |
| 5 | `feat/design/modals` | 05 |
| 6 | `feat/design/onboarding` | 06 |

**1〜2 を先に終わらせる。** 3 以降はトークンとアセットパスが揃っている前提で書いてある。
3 と 4 は依存が強いので順に進める。5・6 は 3 の完了後なら並行してよい。
