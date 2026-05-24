# テスト記録（`docs/tests`）

テストに関する**ドキュメント**を置く場所。テストコード本体はリポジトリ直下の [`tests/`](../../tests/README.md) にまとめる。

| 場所 | 役割 |
|------|------|
| [`tests/`](../../tests/) | Vitest のテストコード（`unit/`・`integration/`） |
| `docs/tests/runs/` | 実行記録（何を・なぜ・結果） |
| `docs/tests/fixtures/` | ダミーデータ・ログイン例・再現用の固定値 |

## テストするときの流れ

1. テストコードを [`tests/unit/`](../../tests/unit/) または [`tests/integration/`](../../tests/integration/) に追加
2. `cd tests && npm test` を実行
3. [runs/_template.md](./runs/_template.md) をコピーし、`docs/tests/runs/YYYY-MM-DD-*.md` に記録を残す
4. 下記「記録一覧」を更新

## ディレクトリ

| パス | 用途 |
|------|------|
| [runs/](./runs/) | 実行記録（1 回の作業 = 1 ファイル） |
| [fixtures/](./fixtures/) | ダミーデータ・ログイン例・再現用の固定値 |

## 記載の目安

- **何を**: 対象の `src/` ファイル・追加した `tests/**/*.test.ts`・実行コマンド
- **なぜ**: 対応する Issue・ADR・不具合
- **結果**: 成功 / 失敗ログの要約・再現手順

## ファイル名（runs）

```
YYYY-MM-DD-kebab-case-summary.md
```

## テンプレート

[runs/_template.md](./runs/_template.md) をコピーして作成する。

## 記録一覧

| 日付 | ファイル | 概要 | テストコード |
|------|----------|------|--------------|
| — | — | （まだなし） | — |

## レガシー

モノレポ時代の記録・フィクスチャは [docs/legacy/tests/](../legacy/tests/) を参照。
（例: [dummy-login.md](../legacy/tests/fixtures/dummy-login.md)）
