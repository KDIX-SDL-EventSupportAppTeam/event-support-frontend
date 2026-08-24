# テスト実行記録 — 2026-05-13（EventDataSource・SampleEventData）

## 何を

- `tests/unit/sample-event-data.test.ts`（`SampleEventData` と `resolveEventDataSourceMode`）。
- 既存テストと合わせ `npm test`、`frontend` で `npm run build`。

## なぜ

サンプルデータクラスがサーバー非依存で一定の結果を返すこと、およびデータソース切替の解決関数が定義域内であることを固定する。

## 実行コマンド

```bash
cd tests && npm test
cd ../frontend && npm run build
```

## 結果

- Vitest: テストファイル 4、テスト 7 件すべて成功。
- `frontend`: `npm run build` 成功。