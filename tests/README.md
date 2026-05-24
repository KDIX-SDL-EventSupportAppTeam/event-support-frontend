# ルート `tests/` — テストコード

Vitest で `src/` のロジックを `@/` エイリアス経由で検証する。
**テストコードはリポジトリ直下の `tests/` にまとめる。** `src/` 内に `*.test.ts` を置かない。

実行記録・フィクスチャのドキュメントは [docs/tests/](../docs/tests/README.md) に残す。

## ディレクトリ

| パス | 用途 |
|------|------|
| `unit/` | 関数・モジュール単位のテスト |
| `integration/` | ビルド設定・パッケージ構成などのスモーク |

## コマンド

```bash
cd tests && npm install && npm test
cd tests && npm run test:watch   # ウォッチ
```

アプリ本体の lint / ビルド確認:

```bash
npm run lint
npm run build
```

## 新規テストを追加するとき

1. `tests/unit/` または `tests/integration/` に `*.test.ts` を追加
2. [docs/tests/runs/_template.md](../docs/tests/runs/_template.md) をコピーし、`docs/tests/runs/` に実行記録を残す
3. 記録に **追加したテストファイルのパス** と **対象の `src/` ファイル** を書く
4. [docs/tests/README.md](../docs/tests/README.md) の記録一覧を更新

## エイリアス

`vitest.config.ts` の `@/` → リポジトリルートの `src/`。
