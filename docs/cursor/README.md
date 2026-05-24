# AI エージェント向けドキュメント

詳細の正本は [AGENTS.md](../../AGENTS.md)。

## 役割分担

| ツール | ファイル | 役割 |
|--------|----------|------|
| Claude Code | [CLAUDE.md](../../CLAUDE.md) | 設計・要件定義。**コードは書かない** |
| Cursor | [.cursor/rules/](../../.cursor/rules/) | **実装**。指示に従いコードを書く |
| 共通 | [AGENTS.md](../../AGENTS.md) | 技術詳細・運用の正本 |

```
AGENTS.md（正本）
    ├── CLAUDE.md      … 設計・要件定義
    └── .cursor/rules/ … 実装（cursor-workflow + ファイル種別 rule）
```

## Cursor rules 一覧

| ファイル | alwaysApply | globs | 内容 |
|----------|-------------|-------|------|
| [cursor-workflow.mdc](../../.cursor/rules/cursor-workflow.mdc) | yes | — | 役割・コマンド・コミット・ドキュメント更新 |
| [project-core.mdc](../../.cursor/rules/project-core.mdc) | yes | — | 境界・アーキテクチャ原則 |
| [react-tsx.mdc](../../.cursor/rules/react-tsx.mdc) | no | `**/*.tsx` | React・Zustand・スタイル |
| [typescript.mdc](../../.cursor/rules/typescript.mdc) | no | `**/*.{ts,tsx}` | TypeScript・import 規約 |
| [tests.mdc](../../.cursor/rules/tests.mdc) | no | `tests/**/*.ts` | テスト配置・記録 |

## テンプレート

| ファイル | 説明 |
|----------|------|
| [CLAUDE.md.template](./CLAUDE.md.template) | CLAUDE.md 更新用 |
| [rules/_template.mdc](./rules/_template.mdc) | 新規 Cursor rule 用 |

## 作業記録

- [2026-05-24-claude-cursor-agent-docs.md](../orders/2026-05-24-claude-cursor-agent-docs.md)
