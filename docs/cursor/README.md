# AI エージェント向けドキュメント

Claude Code と Cursor 向けの指示書は **リポジトリルート** に置く。
詳細の正本は [AGENTS.md](../../AGENTS.md)。

## ファイル構成

| パス | 用途 |
|------|------|
| [CLAUDE.md](../../CLAUDE.md) | Claude Code 向け要約 |
| [.cursor/rules/](../../.cursor/rules/) | Cursor Project Rules（`.mdc`） |
| [AGENTS.md](../../AGENTS.md) | 全エージェント共通の詳細ガイド（正本） |

## 役割分担

```
AGENTS.md          … 詳細な正本（人間・全 AI 向け）
    ↓ 要約
CLAUDE.md          … Claude Code 向け
    ↓ 関心ごとに分割
.cursor/rules/*.mdc … Cursor 向け（ファイル種別・常時適用）
```

## テンプレート

新規 rule や CLAUDE.md 更新時の雛形:

| ファイル | 説明 |
|----------|------|
| [CLAUDE.md.template](./CLAUDE.md.template) | CLAUDE.md の骨子 |
| [rules/_template.mdc](./rules/_template.mdc) | Cursor rule の雛形 |

## 現在の Cursor rules

| ファイル | alwaysApply | globs |
|----------|-------------|-------|
| [project-core.mdc](../../.cursor/rules/project-core.mdc) | yes | — |
| [react-tsx.mdc](../../.cursor/rules/react-tsx.mdc) | no | `**/*.tsx` |
| [typescript.mdc](../../.cursor/rules/typescript.mdc) | no | `**/*.{ts,tsx}` |
| [tests.mdc](../../.cursor/rules/tests.mdc) | no | `tests/**/*.ts` |

## 作業記録

[docs/orders/2026-05-24-claude-cursor-agent-docs.md](../orders/2026-05-24-claude-cursor-agent-docs.md)
