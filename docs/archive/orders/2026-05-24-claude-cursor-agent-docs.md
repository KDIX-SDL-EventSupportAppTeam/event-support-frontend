# 作業指示: CLAUDE.md と Cursor 用ドキュメント整備

- **日付:** 2026-05-24
- **状態:** 完了
- **関連:** ブランチ `docs/multi-repo`

## 背景

マルチレポ移行に伴い、`AGENTS.md` を正本とした AI エージェント向けドキュメントを整備する。
Claude Code（`CLAUDE.md`）と Cursor（`.cursor/rules/`）向けに、役割分担を明確にした指示書が必要。

## 目的

- Claude Code がリポジトリルートの `CLAUDE.md` で即座にコンテキストを得られる
- Cursor が Project Rules でファイル種別ごとの規約を自動適用できる
- 詳細の重複を避け、`AGENTS.md` を単一の正本として維持する

## 作業内容

### 準備（本 PR）

- [x] `docs/cursor/` にテンプレート・骨子を配置
- [x] `.gitignore` で `.cursor/rules/` を追跡可能にする
- [x] 本 orders ファイルの作成

### 実装

- [x] [docs/cursor/CLAUDE.md.template](../cursor/CLAUDE.md.template) をベースにルート [CLAUDE.md](../../CLAUDE.md) を作成
- [x] [.cursor/rules/project-core.mdc](../../.cursor/rules/project-core.mdc)（alwaysApply）を作成
- [x] [.cursor/rules/react-tsx.mdc](../../.cursor/rules/react-tsx.mdc) を作成
- [x] [.cursor/rules/typescript.mdc](../../.cursor/rules/typescript.mdc) を作成
- [x] [.cursor/rules/tests.mdc](../../.cursor/rules/tests.mdc) を作成
- [x] `AGENTS.md` に CLAUDE.md / Cursor rules へのリンクを追加

## 受け入れ条件

- ルート `CLAUDE.md` が存在し、`AGENTS.md` の要点（境界・構成・テスト・ドキュメント）をカバーしている
- `.cursor/rules/` に最低 1 つの alwaysApply rule がある
- 3 ファイル間で矛盾する指示がない

## 実装メモ

### 役割分担

| ファイル | 読者 | 粒度 |
|----------|------|------|
| `AGENTS.md` | 人間・全 AI | 詳細（正本） |
| `CLAUDE.md` | Claude Code | 要約 + 必読リンク |
| `.cursor/rules/*.mdc` | Cursor | 関心ごと・ファイルパターン別 |

### gitignore

`.cursor/*` は無視するが `.cursor/rules/` のみコミット対象とする。

## 関連ドキュメント

- 準備場所: [docs/cursor/README.md](../cursor/README.md)
- 正本: [AGENTS.md](../../AGENTS.md)
- Cursor rule テンプレート: [docs/cursor/rules/_template.mdc](../cursor/rules/_template.mdc)
