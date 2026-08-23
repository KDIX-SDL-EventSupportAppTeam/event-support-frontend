# 作業指示: features + shared ディレクトリリファクタリング

- **日付:** 2026-05-24
- **状態:** 完了
- **関連:** ブランチ `refactor/features-shared` → `develop`

## 背景

AGENTS.md / README の目標構成に合わせ、旧 `src/pages/` 等を feature 単位に分割する。

## 目的

- 全画面・全ルートが `features/` + `shared/` 構成で動作する
- lint / build / Vitest が通る

## 作業内容

- [x] `src/shared/` へ api, data, hooks, types, lib, styles を移行
- [x] `src/features/` へ auth, home, booth, checkin, gachapon, award, schedule, qa, admin を移行
- [x] import パス一括更新（`@/features/*`, `@/shared/*`）
- [x] `router/index.tsx` 更新
- [x] lint / build / test 確認
- [x] ADR・テスト記録・AGENTS.md 更新

## 受け入れ条件

- [x] `npm run build` 成功
- [x] `npm run lint` 成功
- [x] `cd tests && npx vitest run` 成功
- [ ] GUI で全ルート確認（ユーザー実施）

## 関連ドキュメント

- ADR: [docs/adrs/0001-features-shared-directory.md](../adrs/0001-features-shared-directory.md)
- テスト: [docs/tests/runs/2026-05-24-features-shared-refactor.md](../tests/runs/2026-05-24-features-shared-refactor.md)
