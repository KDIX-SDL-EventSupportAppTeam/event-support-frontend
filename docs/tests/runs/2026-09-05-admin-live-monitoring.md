# テスト実行記録 — 2026-09-05（運営ダッシュボードの当日監視ブロック #75）

## 何を

### 対象（src）

- `src/shared/api/v1Admin.ts`（`AdminDashboardBingo` / `RecommenderState` / `RecommenderOpsState` / `fetchRecommenderState` を追加）
- `src/features/admin/components/LiveMonitoringBlock.tsx`（新規。当日監視ブロックの表示コンポーネント）
- `src/features/admin/lib/recommenderStateView.ts`（新規。`reasonMessage` / `remainingToNext` / `fallbackLevel` の純関数）
- `src/features/admin/pages/DashboardPage.tsx`（中継 API の取得を既存の取得タイミングに追加し、ブロックを既存カードの下に描画）

### テストコード（tests）

- `tests/unit/recommender-state-view.test.ts`（新規）

## なぜ

issue #75「運営ダッシュボードに当日監視ブロックが無く、評価回収率などの最重要指標が当日見えない」への対応。設計は
`University/Research/02_コード/P3_2026/改修プラン/三上issue_2026-09/frontend_75_当日監視ブロック.md`（Fable 5.1 / 2026-09-05）。

## 実行コマンド

```bash
npx tsc -b --pretty false
npx eslint src/shared/api/v1Admin.ts src/features/admin/components/LiveMonitoringBlock.tsx \
  src/features/admin/lib/recommenderStateView.ts src/features/admin/pages/DashboardPage.tsx --max-warnings 0
npm --prefix tests run test
```

## 環境

- ブランチ: `feat/live-monitoring-block`（base: `origin/develop` = `eabc29a`）
- データソース: 未実施（下記「メモ」参照）
- 関連 PR / Issue: #75

## 結果

- `npx tsc -b --pretty false` → exit 0（エラーなし）
- 変更した4ファイルに絞った ESLint → exit 0（警告なし）
- `npm --prefix tests run test` → 26 ファイル / 187 件 全 pass（新規 `recommender-state-view.test.ts` は 4 件）
- T-2（評価回収率が画面内最大）: `grep -n "3.5rem" src/features/admin/components/LiveMonitoringBlock.tsx` → 1 件のみ。既存サマリーカードは `fs-3`（約1.75rem）
- T-10（型定義に余分なキーが無い）: `RecommenderOpsState` のキーは `phase.current` / `phase.gate_detail.{size,rules,gamma,coverage}` / `snapshot.{decision_table_size,built_at}` / `config.{phase_similarity_min,phase_drsa_min}` のみ
- T-3・T-8 のロジック（reason ごとの文言・フォールバック率のしきい値段階）は上記ユニットテストで確認済み

## メモ（未実施の項目とその理由）

- **`npx eslint src/features/admin src/shared/api/v1Admin.ts --max-warnings 0`（設計書§6の文言どおりのコマンド）は exit 1。**
  `src/features/admin` フォルダ全体を対象にすると、本 issue と無関係な既存4ファイル（`hooks/useStagedWindowMount.ts`,
  `pages/BoothManagePage.tsx`, `pages/CategoryManagePage.tsx`, `pages/ParticipantsPage.tsx`, `pages/SurveyManagePage.tsx`）の
  `react-hooks/exhaustive-deps` 警告6件が出る。`git stash` で本変更を退避し `origin/develop` ベースの状態で同コマンドを実行しても
  同じ6件の警告が出ることを確認済み＝本変更由来ではなく既存の技術的負債。設計書§5「スコープ外の掃除・リファクタをしない」に従い、
  この5ファイルは触っていない。**本 issue で実際に変更・追加した4ファイルに絞った ESLint は exit 0。**
- T-1・T-4・T-5・T-6・T-7・T-9・T-11（Playwright での実機確認、`RECOMMENDER_URL` の切り替え、参加者アカウントでのリダイレクト確認など）は
  **未実施**。`University/CLAUDE.md` の「`Research/02_コード/P3_2026` のローカル環境には触らない」の対象であり、かつ
  server・recommend の各リポジトリで #87・#91・#113・#114 など並行作業が進んでいるため、MySQL・server・recommend エンジンの
  起動や `.env` 相当の環境変数変更を伴う実機確認は行わなかった。設計書§7が想定するとおり「リハーサル」フェーズでの実施が必要。
- `git show HEAD:...` / `git diff --name-only origin/develop...HEAD` を使う完了条件は、本タスクのガードレール
  （コミットしない・`git add` まで）によりコミット前提のコマンドがそのままでは意図通り動かない。作業ツリーに対する
  同等の確認（`grep` / `git status --short`）で代替し、結果は上記のとおり。
