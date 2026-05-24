# テスト実行記録 — 2026-05-24（features/shared リファクタリング）

## 何を

### 対象（src）

- `src/features/*` — 全 feature ページ・hooks・store 等
- `src/shared/*` — api, data, hooks, types, lib, styles
- `src/router/index.tsx`, `src/main.tsx`

### テストコード（tests）

- `tests/unit/*.test.ts`（import パス更新）
- `tests/integration/frontend-package.test.ts`

## なぜ

ADR 0001 に基づき `src/pages/` 等から `features/` + `shared/` へ移行。ビルド・テストが通ることを確認。

## 実行コマンド

```bash
npm run lint
npm run build
cd tests && npm install && npx vitest run
```

## 環境

- ブランチ: `refactor/features-shared`
- データソース: `sample`（開発既定）

## 結果

- `npm run lint`: 成功
- `npm run build`: 成功
- Vitest: 5 ファイル・15 テストすべて成功

## メモ

- GUI 確認はユーザー帰宅後に実施予定（全ルートの画面遷移）
