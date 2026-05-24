# 作業指示: Cursor Project Rules 整備

- **日付:** 2026-05-24
- **状態:** 完了
- **関連:** ブランチ `docs/multi-repo`

## 背景

[CLAUDE.md](../../CLAUDE.md) で設計担当の役割を定義済み。Cursor は実装担当として、
指示に従いコードを書く際の振る舞い（コマンド・コミット・ドキュメント更新）を rule 化する。

## 目的

- Cursor が `.cursor/rules/cursor-workflow.mdc` で実装方針を把握できる
- AGENTS.md に Cursor / Claude の役割分担を明記する

## 作業内容

- [x] `.cursor/rules/cursor-workflow.mdc` を追加（alwaysApply）
- [x] `AGENTS.md` に Cursor（実装担当）セクションを追加
- [x] `docs/cursor/README.md` を役割分担表に更新
- [x] `.gitignore` で `.cursor/rules/` を追跡可能にする

## 受け入れ条件

- Cursor rule に「コードを書く」「コマンドは自由だが重大時は中止」「日本語コミット」「ドキュメント頻繁更新」が記載されている
- CLAUDE.md（設計）と矛盾しない

## 関連ドキュメント

- [docs/cursor/README.md](../cursor/README.md)
- [AGENTS.md](../../AGENTS.md)
- [.cursor/rules/cursor-workflow.mdc](../../.cursor/rules/cursor-workflow.mdc)
