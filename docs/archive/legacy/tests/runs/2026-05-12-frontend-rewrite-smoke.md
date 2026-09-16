# テスト実行記録 — 2026-05-12（フロント設計準拠リプレイス初回）

## 何をテストしたか

1. **単体（`tests/unit/api-unwrap.test.ts`）**  
   `frontend/src/api/unwrap.ts` の `unwrapApiData` が、`docs/designs/api.md` の共通形式 `{ success, data }` / `{ success, error }` に従って値を取り出すか、失敗時に `ApiError` を投げるか。

2. **結合（スモーク）（`tests/integration/frontend-package.test.ts`）**  
   新フロントの `package.json` に `build` スクリプトが定義されていること（パッケージ構成の健全性）。

3. **ビルド（手動コマンド）**  
   `frontend` で `npm run build`（TypeScript + Vite 本番ビルド）。

## なぜ

- API ラッパーは今後すべてのリポジトリ層が依存するため、最初に仕様どおりの分岐を固定しておく。
- Vue から React へ置き換えるため、`tsc -b` と Vite ビルドが通ることをキリのいい区切りで確認する。

## 実行コマンド

```bash
cd tests && npm install && npm test
cd ../frontend && npm install && npm run build
```

## 結果

- `tests`: **Vitest 3.2.4** — `unit/api-unwrap.test.ts` 2 件、`integration/frontend-package.test.ts` 1 件、いずれも成功（2026-05-12 実行）。
- `frontend`: **`npm run build`**（`tsc -b` + `vite build`）成功。出力は `frontend/dist/`。
