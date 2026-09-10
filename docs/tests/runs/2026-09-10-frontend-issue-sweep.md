# テスト実行記録 — 2026-09-10（サーバー先行7機能のフロント実装 #63/#86/#87/#89/#103/#104/#107）

## 何を

`event-support-server` の `feat/remaining-issues`（#121/#122/#124/#125/#126）を受けて、
フロント側で7つの機能を実装した。統合ブランチ `integration/frontend-issue-sweep` にまとめている。
自動テスト（Vitest）は純関数・API マッピング・禁止語チェックに限る。
**カメラ（QR 読み取り）と画面の見た目は自動化せず、下の「実機確認項目」で確かめる**
（`docs/rules/testing.md`）。

### #63 ホームに X ポストボタン

- 対象（src）
  - `src/features/home/share/sharePostTemplate.ts`
  - `src/shared/lib/xShare.ts`
  - `src/features/home/components/XShareButton.tsx`
  - `src/features/home/pages/HomePage/HomePage.tsx`
  - `src/vite-env.d.ts` / `.env.example`（`VITE_X_SHARE_URL`）
- テストコード（tests）
  - `tests/unit/share-post-template.test.ts`（文面生成・Intent URL 生成の純関数 8 ケース）
- 実機確認項目
  - ホームに「X にポストする」ボタンが表示され、既存の副導線と様式が揃っている
  - 押すと確認モーダル → 「はい」で X の投稿画面が別タブで開き、テンプレートどおりの文面が入っている
  - `noopener,noreferrer` で開く（元タブが操作されない）

### #86 手動コード入力（参加者 UI）

- 対象（src）
  - `src/features/checkin/pages/CheckInPage.tsx`（`step='manual'` の追加、`handleManualCheckIn`）
  - `src/features/checkin/pages/CheckInQrScanView.tsx`（「QRが読めないときはコードを入力」導線）
  - `src/shared/lib/checkInFlowView.ts`（`CheckInStep` に `'manual'`）
- テストコード（tests）
  - `tests/unit/parseQrToBoothId.test.ts`（既存。QR 抽出の純関数。手動入力そのものは UI のため下で実機確認）
- 実機確認項目
  - 素の `/checkin` の QR 画面に「QRが読めないときはコードを入力」があり、QR より目立たない位置にある
  - 正しい6桁コードでチェックインが成立し、QR と同じ確認画面が出る
  - 存在しないコードで「コードが違います」と分かる文言が出る（汎用エラーにしない）
  - 訪問済みブースのコードで「訪問済み」表示になる（赤エラーにならない）
  - 5桁・7桁では送信ボタンが無効。前後に空白のある6桁を貼り付けても通る（`maxLength` は 6 ちょうどにしない）
  - スマホで入力欄をタップすると数字キーパッドが出る
  - 送信中に連打しても二重にチェックインされない

### #87 ダッシュボードのガチャコイン使用状況ブロック

- 対象（src）
  - `src/shared/api/v1Admin.ts`（`AdminGachaStats` / `fetchAdminGachaStats`）
  - `src/features/admin/components/GachaUsageBlock.tsx`
  - `src/features/admin/pages/DashboardPage.tsx`
- テストコード（tests）
  - `tests/unit/v1-admin-gacha-stats.test.ts`（`gacha/stats` の URL とレスポンス透過）
- 実機確認項目
  - 正常系で獲得数・使用数・実人数・時間帯別が表示される（獲得と使用が両方見える）
  - `gacha/stats` の取得に失敗したとき、`0` ではなく「取得できない」旨が出る（他の集計は表示され続ける）
  - `viewer` ロールでも閲覧できる（`manager` 限定になっていない）
  - 参加者アカウントでこの画面に到達できない

### #104 当日ガチャの停止／再開スイッチ

- 対象（src）
  - `src/shared/api/v1Admin.ts`（`patchAdminGachaEnabled`、`AdminGachaStats` に `is_enabled` / `total_earned`）
  - `src/features/admin/components/GachaUsageBlock.tsx`（停止/再開ボタン・状態バッジ）
  - `src/features/admin/pages/DashboardPage.tsx`
  - `src/features/gachapon/pages/GachaponUsePage.tsx`（参加者側の停止時文言）
  - `src/shared/data/content/eventContent2026.ts`（Q&A の見出し）
- テストコード（tests）
  - `tests/unit/v1-admin-gacha-stats.test.ts`（`patchAdminGachaEnabled` の URL とボディ）
  - `tests/unit/event-content-2026.test.ts`（Q&A 禁止語チェック。緑）
- 実機確認項目
  - `manager` でスイッチが見え、押すと確認が出る。`viewer` ではスイッチが表示されない
  - 停止すると運営画面が「停止中」になり、参加者のガチャ画面に停止中の文言が出る
  - その文言に「期間終了」「終了」が含まれない。停止→再開で獲得済みコイン数が変わらない
  - 参加者アカウントでこの操作に到達できない（server も `manager` 限定で 403）

### #107 パスワード再設定の画面と導線

- 対象（src）
  - `src/features/auth/api/passwordReset.ts`
  - `src/features/auth/pages/ForgotPasswordPage/ForgotPasswordPage.tsx`
  - `src/features/auth/pages/ResetPasswordPage/ResetPasswordPage.tsx`
  - `src/features/entry/steps/AuthStep.tsx`（参加者ログインからの導線）
  - `src/features/admin/pages/AdminLoginPage.tsx`（運営ログインからの導線）
  - `src/router/index.tsx`（placeholder ルートの差し替え）
  - `src/shared/data/content/eventContent2026.ts`（Q&A「ログインできません」を再設定できる文面に）
- テストコード（tests）
  - `tests/unit/password-reset-api.test.ts`（申請・再設定の URL / ボディ、モックモードの 410）
  - `tests/unit/event-content-2026.test.ts`（禁止語から `パスワードを忘れた場合」` を除外。緑）
- 実機確認項目
  - `/forgot-password?event=<uuid>` が開き、宛先イベント名が出る（`?event=` 無しは既定イベントへ解決し明示）
  - 登録済み・未登録どちらのメールでも同じ文言が出る。送信中の連打で二重送信されない
  - メールのリンクから `/reset-password/:token` が開き、確認用入力が一致しないと・8文字未満だと送信できない
  - 新パスワードで変更でき、ログインできる。無効・期限切れトークン（410）で再申請の導線が出る（真っ白にならない）
  - 参加者ログイン（`AuthStep`）と運営ログインの両方にリンクがあり、`eventId` / `effectiveEventId` が引き継がれる
  - 未認証でも `/forgot-password` `/reset-password/:token` が開く（公開ゲートの外側）
  - **戻り先**: `ForgotPasswordPage` の「ログインに戻る」は `/e/<eventId>` へ。
    `ResetPasswordPage` は `?event=` があれば `/e/<eventId>`、無ければ `/login` フォールバック
    （server のリセットリンクに現状 `?event=` は含まれない）
  - server の SMTP 本番設定が済んでいること（届かないと機能不成立）。迷惑メールフォルダも確認

### #103 手動コードの display_code 移行・運営画面でのコード/URL 管理

- 対象（src）
  - `src/shared/api/v1Participant.ts`（`V1BoothListItem.manual_code` → `display_code`）
  - `src/shared/data/api/mapV1Booth.ts` / `src/shared/types/bingoCard.ts` / `src/shared/types/legacyBooth.ts` /
    `src/shared/data/sample/sampleBingoCard.ts`（追随）
  - `src/features/booth/pages/BoothListPage/BoothListPage.tsx` / `src/features/checkin/pages/CheckInPage.tsx`
    （番号バッジ: 未設定時に UUID を出さず「—」）
  - `src/shared/api/v1Admin.ts`（`AdminBoothSummary` に `display_code`/`manual_code`/`checkin_url`、
    `regenerateBoothManualCode`、`AdminBoothInput.manual_code` を任意化）
  - `src/features/admin/pages/BoothManagePage.tsx`（display_code / manual_code / checkin_url の管理、再発番、一覧書き出し）
  - `src/shared/components/CopyButton.tsx`（feature 跨ぎのため shared）
- テストコード（tests）
  - `tests/unit/v1-participant-bingo.test.ts`（既存。bingo/card のマッピング。緑）
  - 運営画面の操作は UI のため下で実機確認
- 実機確認項目
  - ブース一覧・チェックイン一覧の番号バッジに `display_code` が出る。未設定でも崩れず「—」になる
  - `grep -rn "manual_code" src/` が運営画面（BoothManage / BoothAnalytics）と送信処理（checkins の manual）だけ
  - 運営画面に `display_code` / `manual_code` / `checkin_url` が並ぶ。`checkin_url` をコピーできる
  - 新規作成フォームに手動コード入力欄が無い（作成後、一覧に自動採番のコードが出る）
  - 再発番ボタンが `manager` にだけ出て確認を挟む。再発番後、一覧の値が新しいコードに変わる
  - 編集フォームで手動コードを**変えたときだけ**サーバーへ送られる（未変更なら送らない）
  - 一覧の書き出し（TSV）に全ブース分が含まれる。参加者アカウントで運営画面に到達できない

### #89 アワード投票のアプリ内実施

- 対象（src）
  - `src/shared/types/award.ts`（`Award` に統合。`src/shared/types/voteAward.ts` は削除）
  - `src/shared/api/v1Awards.ts`（`fetchAwardVoteSnapshot` / `postAwardVotes`）
  - `src/shared/data/participantTypes.ts`（`AwardVoteSnapshot.votes` を `Record<award_id, booth_id>`、
    `saveVotes(eventId, userId, votes)`）
  - `src/shared/data/api/apiParticipantClient.ts` / `src/shared/data/sample/sampleParticipantClient.ts` /
    `src/shared/data/sample/sampleVoteAwards.ts`（サンプル側も `award_id` キーに統一）
  - `src/features/award/pages/AwardVotePage.tsx`
  - `src/features/admin/pages/AdminAwardsPage.tsx` / `src/features/admin/config/windowRegistry.ts` / `src/router/index.tsx`
  - `src/shared/data/content/eventContent2026.ts`（Q&A 追加）
  - `docs/decisions/adrs/0007-award-voting-in-app-this-year.md`
- テストコード（tests）
  - `tests/unit/v1-awards.test.ts`（スナップショットの snake→camel、投票送信、409 変換）
  - `tests/unit/event-content-2026.test.ts`（禁止語から `アワード` を除外。緑）
- 実機確認項目
  - `/award-vote` が投票画面を表示する（準備中にならない）。選択肢にチェックイン済みブースだけが出る
  - チェックイン0件のとき、エラーではなく案内が出る。投票して保存でき、再訪時に選択が復元される
  - 投票を付け替えられる。`voting_open: false` のとき投票できず、開始前/締切後が分かる文言が出る
  - 締切後の送信で 409 を受け、その旨が出る（画面が壊れない）
  - 未認証で `/award-vote` を開くと入口へリダイレクトされる（ゲート内側のまま）
  - 運営画面で賞ごとのブース別票数が降順で出る。`viewer` に開閉スイッチが出ない
  - Q&A・オンボーディング・ボトムナビの3つが「実施する」で揃っている
  - `VITE_DATA_SOURCE=sample` でも従来どおり動く

## なぜ

`event-support-server` の `feat/remaining-issues` で API 契約が確定したため、
これまでスタブ／プレースホルダだったフロント側を実装に切り替えた。
Issue: #63 / #86 / #87 / #89 / #103 / #104 / #107。ADR: 0007（#89）。

## 実行コマンド

```bash
npx tsc -b
npm run lint
npm test
```

## 環境

- ブランチ: `integration/frontend-issue-sweep`
- データソース: 単体テストは `sample` 相当（`apiClient` をモック）。実機確認は `api`
- 関連 PR: #108(#63) / #109(#87) / #110(#104) / #111(#107) / #112(#103) / #113(#86) / #114(#89)
- server 前提: `event-support-server` `feat/remaining-issues`（#121/#122/#124/#125/#126）が本番に載っていること

## 結果

- `npx tsc -b`: エラーなし
- `npm run lint`: エラーなし（既存の `react-hooks/exhaustive-deps` 警告 5 件のみ。今回の追加分に警告なし）
- `npm test`: 33 ファイル / 234 件すべて成功
  - 新規: `share-post-template.test.ts`(8) / `v1-admin-gacha-stats.test.ts`(2) /
    `password-reset-api.test.ts`(3) / `v1-awards.test.ts`(3)

## メモ

- 実機確認（上記の各「実機確認項目」）はリハーサル（server #96）で消化する。結果はこのファイルに追記する。
- #107 は本番 SMTP 設定が前提。未確認なら機能は成立しない。
- レビュー指摘の修正（戻り先のイベント喪失 / 手動コードの毎回再送 / `maxLength` / タイマー未解除 /
  未使用フック `useAwards` / サンプル賞データ2系統）は本記録と同じブランチで対応済み。
