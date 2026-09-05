# テスト実行記録 — 2026-09-05（手動コード入力チェックインの参加者UIを追加）

## 何を

### 対象（src）

- `src/features/checkin/lib/manualCheckIn.ts`（新規・純関数2つ: `toManualCodeForSubmit` / `manualCheckInErrorMessage`）
- `src/shared/lib/checkInFlowView.ts`（`CheckInStep` に `'manual'` を追加）
- `src/features/checkin/pages/CheckInQrScanView.tsx`（`onManual` プロップとリンクの追加）
- `src/features/checkin/pages/CheckInPage.tsx`（`boothSource` に `'manual'`、`manualCode` state、`handleCheckInManual`、成功/失敗処理の共通化、`'manual'` ステップの描画）
- `src/shared/styles/legacy-participant-pages.scss`（`.checkin-manual-code-input` / `.checkin-manual-link`）

### テストコード（tests）

- `tests/unit/manualCheckIn.test.ts`（新規）

## なぜ

frontend #86「手動コード入力（manual_code）の参加者UIが無い」への対応。QRが読めない参加者のために、
チェックイン画面の副導線から6桁までのコードを入力して `method: 'manual'` でチェックインできるようにする。
照合（コード→ブースの解決）はサーバーが行い、フロントは前後の空白を落とす以外の加工をしない。

依存: #84（QRチェックイン。`CheckInStep` の `'scan'`・`boothSource`・`CheckInQrScanView` の `onDetected`/`onFallback`）の後に載せる。

設計書: `改修プラン/三上issue_2026-09/frontend_86_手動コード入力.md`

## 実行コマンド

```bash
npx tsc -b --pretty false
npx eslint src/features/checkin src/shared/lib/checkInFlowView.ts --max-warnings 0
npm --prefix tests run test
npx --prefix tests vitest run unit/manualCheckIn.test.ts --reporter=verbose
```

## 環境

- ブランチ: `feat/manual-code-input`（base: `origin/feat/checkin-qr-scan-rebuild` = `36e841e`。#84 / PR #93 の先頭）
- データソース: `api`（`isV1Flow` 経路のみ導線を出す。サンプルモードでは出さない）
- 関連 PR / Issue: #86（#84 の後に載せる）

## 結果

すべて 2026-09-05 に実測した値。

| コマンド | 結果 |
|---|---|
| `npx tsc -b --pretty false` | exit 0（型エラーなし） |
| `npx eslint src/features/checkin src/shared/lib/checkInFlowView.ts --max-warnings 0` | exit 0 |
| `npm --prefix tests run test` | 27 test files / 205 tests すべて pass（`manualCheckIn.test.ts` の 8 件を含む） |
| `npx --prefix tests vitest run unit/manualCheckIn.test.ts --reporter=verbose` | 8 tests すべて pass。T-2・T-4・T-5・T-6 を名前に含む it が各1件確認できた |

## T-1〜T-10（設計書 §3-1・§3-2・§7 が定義する確認項目）

自動テスト（純関数）で確認できるのは T-2・T-4・T-5・T-6 のみ。残りは実 API モードでの画面操作（Playwright / 実機）が要り、
本タスクでは §6 の完了条件チェックリスト実行のみが指示範囲だったため、ローカルサーバー・DBを立てての §7 手順は実施していない。

| # | 確認すること | 結果 |
|---|---|---|
| T-1 | `" ai001 "` のような前後空白・小文字コードでチェックインが成立し、QRと同じ成功画面になる（スマホキーボードの表示確認は実機のみ） | 未実施（実APIモード・実機が必要。§7手順2・5） |
| T-2 | コード不一致（404 NOT_FOUND）→ 入力欄の下に「コードが違います。ブースに掲示されたコードをもう一度確認してください。」を表示し、入力欄は残す | 合格（`manualCheckInErrorMessage` の単体テストで確認。画面上の表示位置は §7 手順2で別途確認要） |
| T-3 | 訪問済み（409 CONFLICT）→ `already_visited` 画面（赤いエラー表示にしない） | 未実施（実APIモードが必要。`handleCheckInFailure` の分岐はQRと共通コードのため §4-4(c) の移動元 `handleCheckInV1` で既に担保されている分岐と同一実装） |
| T-4 | 空欄（trim後0文字）では送信できない（ボタン disabled） | 合格（`toManualCodeForSubmit('')` / `('   ')` が `null` を返すことを単体テストで確認。画面の `canSubmit` はこの関数の戻り値で判定） |
| T-5 | 前後の空白を落として送信する（サーバーの `max(6)` が trim 前に掛かるため） | 合格（`toManualCodeForSubmit('  AI001 ')` → `'AI001'` を単体テストで確認） |
| T-6 | 大文字小文字はフロントで変えない（照合はサーバーが UPPER で行う） | 合格（`toManualCodeForSubmit('ai001')` → `'ai001'`（変換なし）を単体テストで確認） |
| T-7 | クールタイム（429 COOLDOWN）→ QRと同じカウントダウン表示、ボタン無効 | 未実施（実APIモード・`CHECKIN_COOLDOWN_SEC` の変更が必要。§7手順2） |
| T-8 | `checkin_method='manual'` の件数が、DBの集計と運営の「チェックイン分析」画面の「手動」の値で一致する | 未実施（データ突合。§7手順4） |
| T-9 | 「QRが読めないときはコードを入力」リンクが、scan画面の「ブース一覧から選ぶ」より後ろの行にある | 合格（`git show HEAD:src/features/checkin/pages/CheckInQrScanView.tsx \| grep -n` で確認。§6完了条件の該当項目を参照） |
| T-10 | ボタンを2回連打してもリクエストが1回だけ飛ぶ（二重送信防止） | 未実施（実APIモード・Networkタブでの確認が必要。§7手順2。実装は既存の `submitting` state による disabled 制御を流用しており、QRの導線と同じ仕組み） |

## メモ

- 本タスクの指示範囲は設計書 §6（完了条件チェックリスト）の実行までで、§7 の Playwright / 実機 / データ突合による確認は含まれていない。T-1・T-3・T-7・T-8・T-10 は上記のとおり未実施。実施は三上くんとのリハーサル時（設計書 §7-5）に行う想定。
- T-3・T-7 はコードパス上は QR チェックイン（`handleCheckInV1`）と同じ `handleCheckInFailure` 関数を通るため、#84 の QR チェックインで同じ分岐が動作確認済みであることの上に成り立つ（`docs/tests/runs/2026-09-05-checkin-qr-scan.md` 参照）。ただし手動コード入力の画面固有の見え方（`'manual'` ステップの描画）は未確認。
