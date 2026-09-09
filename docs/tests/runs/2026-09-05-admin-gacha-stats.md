# テスト実行記録 — 2026-09-05（運営ダッシュボードのガチャ使用状況 #87・Phase A）

## 何を

### 対象（src）

- `src/shared/api/v1Admin.ts`（`AdminGachaStats` 型と `fetchAdminGachaStats` を追加）
- `src/features/admin/components/GachaUsageBlock.tsx`（新規。ガチャ使用状況の表示コンポーネント）
- `src/features/admin/lib/gachaStatsView.ts`（新規。`resolveGachaFetchState` / `formatHourLabel` / `formatFetchedAt` の純関数）
- `src/features/admin/pages/DashboardPage.tsx`（取得（初回＋60秒＋手動）を追加し、`LiveMonitoringBlock`（#75）の直下にブロックを描画）

### テストコード（tests）

- `tests/unit/gacha-stats-view.test.ts`（新規）

## なぜ

issue #87「ガチャコイン使用状況を運営画面で見られるようにする」への対応。設計は
`University/Research/02_コード/P3_2026/改修プラン/三上issue_2026-09/frontend_87_ガチャ使用状況.md`（Fable 5.1 / 2026-09-05）。

server `GET /admin/events/:event_id/gacha/stats` が返す 4 項目（`total_used` / `users_with_coins` / `users_who_used` /
`used_by_hour`）のみを Phase A として結線する。issue が求める獲得済み総数・`is_enabled` は API に無いため、
server 追加後の Phase B（本 PR の範囲外）で足す。

## 実行コマンド

```bash
npx tsc -b --pretty false
npx eslint src/shared/api/v1Admin.ts src/features/admin/components/GachaUsageBlock.tsx \
  src/features/admin/lib/gachaStatsView.ts src/features/admin/pages/DashboardPage.tsx \
  tests/unit/gacha-stats-view.test.ts --max-warnings 0
npm --prefix tests run test
```

## 環境

- ブランチ: `feat/gacha-usage-block`（base: `origin/feat/live-monitoring-block` = `176f8f3`。#75 の当日監視ブロックの直下に配置するため）
- データソース: 未実施（下記「メモ」参照）
- 関連 PR / Issue: #87（依存: #75）

## 結果

- `npx tsc -b --pretty false` → exit 0（エラーなし）
- 変更・追加5ファイルに絞った ESLint → exit 0（警告なし）
- `npm --prefix tests run test` → 27 ファイル / 193 件 全 pass（新規 `gacha-stats-view.test.ts` は 5 件。T-4・T-6 を名前に含む it 各1件）
- `git show`/`grep` 相当（作業ツリーへの grep）:
  - `v1Admin.ts` に `gacha/stats` 呼び出しが1件
  - `GachaUsageBlock.tsx` に「取得できません」1件・「の値」1件（stale 表示あり）
  - `git grep -n "shared/config/gachapon" -- src/features/admin` → 0件（I5）
  - `git grep -n "gacha/coins" -- src/features/admin src/shared/api/v1Admin.ts` → 0件（参加者 API を呼ばない）
  - `DashboardPage.tsx` に `Promise.all` → 0件
  - `DashboardPage.tsx` の描画順: `LiveMonitoringBlock`（173行目）→ `GachaUsageBlock`（175行目）の順で後者が後

### T-1〜T-10（issue #87 設計書§6・§8 が想定するテスト項目）

| # | 項目 | 結果 |
|---|------|------|
| T-1 | Phase A の基本結線: server の4項目が `/admin/dashboard` に `LiveMonitoringBlock`（#75）の直下で表示される | コードレベルで確認（描画順・props 結線）。実機での目視は未実施（下記メモ） |
| T-2 | 獲得済みコインと使用済みコインを隣接表示する | **Phase B**（`total_earned` は server 未実装。設計書§3-1・§4-7） |
| T-3 | 稼働中/停止中バッジで「止まっている」ことが分かる | **Phase B**（`is_enabled` は server 未実装。設計書§3-1・§4-7） |
| T-4 | 取得失敗・過去値なし → `error`（数字欄を描画しない） | 純関数 `resolveGachaFetchState` の単体テストで確認済み（`gacha-stats-view.test.ts`）。実機（server 停止）での確認は未実施 |
| T-5 | ガチャ取得が失敗してもサマリーカード・当日監視ブロックは表示され続ける（`Promise.all` で束ねない） | コードレベルで確認（`loadGacha` は独立した `try/catch`、`Promise.all` 不使用）。実機確認は未実施 |
| T-6 | 取得成功・`used_by_hour` が空 → `使用済みコイン 0 枚`／「まだ使用がありません（0件）」（`取得できません` は出ない） | 純関数の単体テスト＋`HourBars` の分岐で確認済み。実機（`gacha_coin_uses` 0行のイベント）での確認は未実施 |
| T-7 | 参加者アカウントで `/admin/dashboard` → `/home` にリダイレクト | 既存ガード（`RequireAdmin`）に変更なし。本 PR での新規確認は未実施 |
| T-8 | `viewer` ロールで `/admin/dashboard` を開いてもガチャブロックが表示される（403にならない） | server 側の認可ロジックは未変更（F1: `requireStaff` は manager/viewer 許可）。実機確認は未実施 |
| T-9 | `v1Admin.ts` に server が返さないフィールドを書かない | 確認済み: `AdminGachaStats` のキーは `total_used` / `users_with_coins` / `users_who_used` / `used_by_hour` / `hour` / `count` のみ |
| T-10 | 実際に配ったカプセル数と画面表示の突合 | **リハーサル**（設計書§7-6。当日運用の実機データが無いと確認できない） |

## メモ（未実施の項目とその理由）

- **T-1・T-4・T-5・T-6・T-7・T-8・T-10（実機での目視・server 停止・500応答・`viewer` ロール・参加者リダイレクト・
  Playwright snapshot・データ突合・リハーサル）は未実施。** `University/CLAUDE.md`「`Research/02_コード/P3_2026` のローカル環境には触らない」の
  対象であり、かつ server・#75・他 issue の並行作業が進んでいるため、MySQL・server の起動や DB の role 変更を伴う実機確認は
  行っていない。設計書§7が想定するとおり「リハーサル」フェーズでの実施が必要（T-2・T-3 は Phase B、T-10 はリハーサルと明記）。
- `git show HEAD:...` / `git diff --name-only <#75後のdevelop>...HEAD` を使う完了条件は、本タスクのガードレール
  （コミットしない・`git add` まで）によりコミット前提のコマンドがそのままでは意図通り動かない。作業ツリーに対する
  同等の確認（`grep` / `git status --short`）で代替し、結果は上記のとおり。
