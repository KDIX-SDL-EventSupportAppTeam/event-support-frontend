# Cursor rule テンプレート

Project Rules の正本は [.cursor/rules/](../../../.cursor/rules/)（リポジトリルート）。

## 現在の rule

| ファイル | 説明 |
|----------|------|
| `cursor-workflow.mdc` | Cursor の役割・コマンド・コミット・ドキュメント（alwaysApply） |
| `project-core.mdc` | 境界・アーキテクチャ（alwaysApply） |
| `react-tsx.mdc` | React コンポーネント |
| `typescript.mdc` | TypeScript 全般 |
| `tests.mdc` | Vitest |

新規 rule は [_template.mdc](./_template.mdc) をコピーして `.cursor/rules/` に追加し、
[docs/cursor/README.md](../README.md) の一覧を更新する。
