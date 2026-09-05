# テスト実行記録 — 2026-09-05（チェックインのQRコード読み取りを追加）

## 何を

### 対象（src）

- `src/features/checkin/lib/parseQrToBoothId.ts`（新規・QR文字列 → booth_id の純関数）
- `src/features/checkin/pages/CheckInQrScanView.tsx`（新規・カメラ起動と読み取り）
- `src/features/checkin/pages/CheckInPage.tsx`（`scan` ステップの追加と結線）
- `src/shared/lib/checkInFlowView.ts`（`CheckInStep` に `'scan'` を追加）
- `src/shared/styles/legacy-participant-pages.scss`（QR画面のスタイル3ブロック）

### テストコード（tests）

- `tests/unit/parseQrToBoothId.test.ts`（新規）

## なぜ

frontend #84「行っていないブースにチェックインできる」への対応。ブース一覧から選ぶだけの現行フローでは、
実際に訪問していないブースにもチェックインできてしまい、「チェックイン＝実訪問」という研究の前提が当日のデータで崩れる。
QRコードを読んだブースにしかチェックインできない状態にする。

設計書: `改修プラン/三上issue_2026-09/frontend_84_QRチェックイン.md`

## 実行コマンド

```bash
npx tsc -b --pretty false
npx eslint src/features/checkin src/shared/lib/checkInFlowView.ts --max-warnings 0
npm --prefix tests run test
```

## 環境

- ブランチ: `feat/checkin-qr-scan-rebuild`（base: `origin/develop` = eabc29a）
- データソース: `api`
- 関連 PR / Issue: #84（PR #62 を置き換える）

## 結果

すべて 2026-09-05 に実測した値。

| コマンド | 結果 |
|---|---|
| `npx tsc -b --pretty false` | exit 0（型エラーなし） |
| `npx eslint src/features/checkin src/shared/lib/checkInFlowView.ts --max-warnings 0` | exit 0 |
| `npm --prefix tests run test` | 26 test files / 197 tests すべて pass |
| `npx vitest run unit/parseQrToBoothId.test.ts --reporter=verbose` | 14 tests すべて pass（T-5・T-8・T-9・T-10 を名前に含む it を確認） |

### ローカルのブラウザ確認（Playwright・サンプルモード）

`.env` はローカルデモ用に実 API モードを指定しているため、コマンドラインで
`VITE_MOCK_API=true VITE_DATA_SOURCE=sample` を上書きして `npm run dev` を起動し、
ヘッドレス Chromium（カメラ無し）で画面遷移だけを確認した。
**実機・実カメラでの確認は下の T-11〜T-21 のとおり未実施。**

| # | 確認したこと | 結果 |
|---|---|---|
| L-1 | 素の `/checkin` を開くと `scan` ステップが描画され、**白画面にならない** | 合格。「QRコードをかざしてください」と「ブース一覧から選ぶ」が表示された |
| L-2 | 「ブース一覧から選ぶ」を押すと従来のブース一覧に落ちる（フォールバック） | 合格。一覧6件と「QRを読み取る」「ホームに戻る」が表示された |
| L-3 | `?booth_id=C` で開くと**一覧が出ず**、そのブース1件の確認表示になる | 合格。「このブースにチェックインします。」＋「🔧 ハードウェア」＋「別のブースを読み取る」 |
| L-4 | チェックイン済みブース `?booth_id=A` で「訪問済みです」になる（赤エラーにしない） | 合格。「訪問済みです」画面へ遷移した |
| L-5 | 一覧に無い `?booth_id=00000000-0000-4000-8000-000000000000` | 合格。「このQRコードは、このイベントのブースではありません。」＋「もう一度読み取る」「ブース一覧から選ぶ」が出て、「チェックインする」は disabled |

**未検証**: ヘッドレス Chromium ではカメラ権限が拒否も許可もされず `start()` が保留のままだったため、
`CAMERA_FAILED_MSG`（「カメラを起動できませんでした。…」）が表示される経路は確認できていない。
ただし L-1 のとおり、`start()` が返らない状態でも見出しとフォールバックボタンは描画されており、
issue #84 が「起きてはいけないこと」に挙げた白画面にはならない。

## 実機・リハーサルでの確認項目（T-11〜T-21）

カメラは secure context と実デバイスが要るため、以下はローカルの自動テストでは検証できない。
実機リハーサル（三上くん日程）で実施し、この表の「結果」欄を埋める。
**T-11〜T-20 の文言は issue #84 本文の「実機（自動化しない。リハーサルで行う）」の定義をそのまま使う。**
T-21 は本実装で追加した確認項目（issue には無い）。

| # | 確認すること | 結果 |
|---|---|---|
| T-11 | 素の `/checkin` を開くとカメラが起動する | 未実施（リハーサル） |
| T-12 | ブースの QR を読むとチェックイン確認画面へ進む | 未実施（リハーサル） |
| T-13 | カメラ権限を拒否するとフォールバック導線が出る（白画面にならない） | 未実施（リハーサル） |
| T-14 | カメラの無い端末でもフォールバック導線が出る | 未実施（リハーサル） |
| T-15 | 対象外の QR（他サイト等）を読んでも止まらず、スキャンが続く | 未実施（リハーサル） |
| T-16 | 同じ QR を2回読んでも「訪問済み」表示になり、赤いエラーにならない | 未実施（リハーサル） |
| T-17 | 画面を離れるとカメラが停止する（端末のインジケータで確認） | 未実施（リハーサル） |
| T-18 | `?booth_id=` 付きで開くと、従来どおりブース確認から始まる | 未実施（リハーサル） |
| T-19 | 開発時の StrictMode でカメラが二重に起動しない | 未実施（リハーサル） |
| T-20 | 会場の照明・QR の印刷サイズで実際に読み取れる | 未実施（リハーサル） |
| T-21 | QR 読み取り後の画面にブース一覧が出ない（別のブースに選び直せない）。本 issue の核心 | 未実施（リハーサル） |

## 監査（Opus 別コンテキスト）で挙がった、実機で確かめるべき点

| # | 内容 | どこで見るか |
|---|---|---|
| V-1 | StrictMode の二重マウント時、cleanup は `startPromise` の決着を待ってから停止するため、`getUserMedia` が一瞬 2 本開く。さらに先発インスタンスの `clear()`（`element.innerHTML = ''`）が後発の `<video>` を消し、黒い枠だけが残る可能性がある | **T-19**。`npm run dev` の実機でプレビューが出るか、カメラインジケータが一瞬 2 つ点かないかを見る |
| V-2 | `.checkin-qr-reader` が `aspect-ratio: 1/1` ＋ `overflow: hidden` のため、4:3 / 16:9 の映像は上下が切れる。読み取り枠（`qrbox` = 映像短辺の 80%）の一部が画面外に出る可能性がある | **T-20**。実機で枠が全部見えるかを見る |
| V-3 | `html5-qrcode` を静的 import しているため main チャンクに常時同梱される（ビルド後 1,195.80 kB / gzip 363.18 kB）。ログイン画面でも読み込まれる | 本 issue のスコープ外。遅延読み込みは別 issue の候補 |

## メモ

- T-20 が不合格なら、issue #84 本文の3択のうち「今年やらない」に倒し、
  analytics と論文側に「チェックインは自己申告」と限界を明記する（判断者は三上くん・須藤先生）。
- フォールバック（一覧選択）経由のチェックインも `method='qr'` で記録される。
  一覧経由を区別する案は API 契約の変更を伴うため本 issue では行わない（三上くんに確認中）。
