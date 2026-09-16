# テスト実行記録 — 2026-08-26（デザイントークンのコントラスト比検証）

## 何を

### 対象（src）

- `src/shared/styles/tokens.scss`（新規。`--pf-*` CSS変数一式）
- `src/shared/styles/legacy-app.scss`（Bootstrap変数を`$pf-yellow`/`$pf-orange`へ差し替え、`.btn-primary`の文字色を明示）
- `src/main.tsx`（`tokens.scss`を`legacy-app.scss`より先に読み込む）
- `src/features/admin/components/AdminShell.tsx`（`#f8f9fa` → `var(--pf-cream-light)`）
- `src/features/organizer/components/OrganizerShell.tsx`（`#f8f9fa` → `var(--pf-cream-light)`）
- `src/features/exhibitor/pages/ExhibitorDashboardPage.tsx`（`#f8f9fa` → `var(--pf-cream-light)`、`#f8730d` → `var(--pf-orange)`）

### テストコード（tests）

- `tests/unit/design-tokens.test.ts`（新規）
- `tests/unit/contrast.ts`（新規。WCAG 2.1のコントラスト比計算ヘルパー。テスト専用で`src/`には置かない）

## なぜ

`docs/specs/design-refresh-2026/01-design-tokens.md` に基づき、前年の配色（オレンジ・赤系）を
2026年版（黄色系）へ全画面で置き換える。`$primary`が黄色になり文字の可読性が最大のリスクとなるため、
目視だけに頼らず自動テストでコントラスト比を担保する。

## 実行コマンド

```bash
npm run test
npm run lint
npm run build
```

## 環境

- ブランチ: `feat/design/tokens`
- データソース: `sample`
- 関連PR / Issue: なし（ローカルコミットのみ）

## 結果

- `npm run test`: 成功（19 test files / 106 tests すべて成功。`design-tokens.test.ts`は12テスト）
- `npm run lint`: 成功（0 errors。既存の6件の警告は本変更と無関係な既存コード）
- `npm run build`: 成功（Bootstrap/Sassの非推奨警告は本変更前から存在する既知のもの）
- `grep -rn "proto-red\|proto-orange\|proto-dark-orange" src` は0件

## メモ

- この仕様（01-design-tokens.md）の範囲は`tokens.scss`の新規作成・`legacy-app.scss`の変数差し替え・
  3シェルのべた書き置換のみ。`legacy-participant-pages.scss`等の参加者画面のべた書きは対象外で、
  後続の仕様（04-home-and-bingo.md 等）で扱う。
- 統計グラフの系列色（`admin/windows/*.tsx`、`DashboardPage.tsx`の`#0d6efd`等）は仕様どおり変更していない。
- 目視確認（ボタン文字色・フォーカスリング等）は自動テストの対象外。実機・ブラウザでの確認が別途必要。
