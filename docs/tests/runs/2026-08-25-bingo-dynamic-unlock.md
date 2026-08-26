# テスト実行記録 — 2026-08-25（ビンゴ動的段階解放のUI実装と検証）

サーバー側の仕様変更（中央4マス一括解放 → 中央2マスごとの逐次解放、最大3回）に対応した
UI 実装の記録。API 契約の正本は `event-support-server` の
[docs/specs/bingo-dynamic-unlock/06-api/participant-api.md](https://github.com/KDIX-SDL-EventSupportAppTeam/event-support-server/blob/develop/docs/specs/bingo-dynamic-unlock/06-api/participant-api.md)。

## 何を

### 対象（src）

- `src/shared/types/bingoCard.ts` — セルを `is_revealed` / `is_achieved` の2軸へ。`coins` / `status` / `reason` を削除
- `src/shared/api/v1Participant.ts` — 新レスポンス契約（`unlocked_positions` / `unlocked_pairs` / `pending_rating`）
- `src/shared/lib/bingoUnlockFlag.ts` — 再生済みフラグを `pair_key` 単位へ作り直し
- `src/shared/lib/bingoUnlockQueue.ts`（新規）— 解放演出キューの純粋ロジック
- `src/shared/lib/checkInFlowView.ts`（新規）— 評価 → 成功 → 解放演出の順序判定（純関数）
- `src/shared/hooks/useUnlockAnimationQueue.ts` — 上記を使うフック
- `src/shared/api/appAccess.ts` / `src/shared/hooks/useAppAccess.ts`（新規）— アプリ公開ゲート
- `src/shared/access/RequireAppOpen.tsx`（新規）— ルーティング入口のゲート
- `src/shared/api/publicEvent.ts` / `publicClient.ts`
- `src/features/home/components/bingo/BingoCellView.tsx` / `BingoCardView.tsx` / `UnlockAnimation.tsx`
- `src/features/home/pages/HomePage/HomePage.tsx` / `hooks/useBingoUnlockedSocket.ts` / `useHomeBingoData.ts`
- `src/features/checkin/pages/CheckInPage.tsx` / `CheckInRatingModal.tsx`
- `src/features/presurvey/` — localStorage モックを実 API 連携へ置換
- `src/router/index.tsx` — `/gachapon` `/award-vote` を「準備中」表示に

削除: `CheckInRecommendView.tsx` / `ReasonPanel.tsx` / `legacyHttp.ts` / `legacyParticipant.ts` /
`presurveyLocalStore.ts` / `presurveySessionStore.ts` / `config/questions.ts` /
`bingoUnlockPairs.ts`（サーバーのペア対応表の複製だったため）

### テストコード（tests）

- `tests/unit/bingo-card.test.ts` — 新セル形状、`pair_key` 単位のフラグ、複数ペア同時解放、二重投入の禁止
- `tests/unit/v1-participant-bingo.test.ts` — 新チェックイン／カードのレスポンス形状
- `tests/unit/bingo-celebration.test.ts` — コイン計算の除去
- `tests/unit/app-access.test.ts` / `use-app-access.test.ts` / `presurvey-api.test.ts`（新規）

## なぜ

`docs/specs/bingo-dynamic-unlock/` および `docs/specs/pre-survey/` の実装。
着手時点で両仕様書は「状態: 草案」だったが、明示の承認を得て例外的に実装した
（`AGENTS.md` の「『状態: 確定』でない仕様は実装しない」に対する例外）。
本記録の作成にあわせて状態を「実装済み」へ更新。

## 実行コマンド

```bash
npm test
npm run lint
npx tsc -b --noEmit
npm run dev
```

## 結果

`npm test` — 18 ファイル / **94 ケース 全通過**（実装前 85）。
`npm run lint` — **エラー 0**（既存の警告 6 件は `features/admin` 配下で今回未変更）。
`npx tsc -b --noEmit` — 通過。

## 実装後に発見して修正した問題

### 2回目・3回目の解放で演出が出なかった（最重要）

チェックインのレスポンスは `unlocked_positions` に**全ペア分の position を平坦に**返す。
中央3マス目の達成では2組が同時成立して `[1,13,3,12]` のようになるため、
フロント側が持っていたペア対応表の逆引き（単一ペア2マスの組み合わせしか持たない）は `null` を返し、
**3回ある解放のうち2回で演出が完全に欠落**していた。

サーバーが `unlocked_pairs` を返すよう契約を拡張して解決。
これによりフロント側の対応表の複製（`AGENTS.md` の
「API 契約・ビジネスルールの正本は `event-support-server`、こちらにコピーしない」
「フロントで計算しない」に反していた）を削除できた。

### 同じ解放演出の二重再生

再生済みフラグを演出完了時にしか書かず、キュー内の重複も見ていなかったため、
再生中に再取得が走ると同じ `pair_key` が再度積まれていた。
キュー投入時に「未再生 かつ キュー内に未存在」の両方で判定するよう修正。

### 解放演出が評価ステップより先に再生されていた

`03-checkin-flow.md` は「1. 評価 → 2. 成功 → 3. 解放演出」と定め、
評価を先頭に置く理由を回収率（後回しにすると3割を切る）と説明している。
描画分岐の順序が逆になっていたため、仕様どおりに修正した。

### `app_access` の入れ子位置がサーバーと食い違い白画面

サーバーは `data: { event: {...}, app_access: {...} }` と**兄弟**で返すが、
フロントは `event` の中にあると想定して `event.app_access.is_open` を読み、
`undefined` を踏んでアプリ全体が落ちていた。
仕様書が入れ子の位置を決めていなかったのが根本。
サーバーの実レスポンスに合わせるとともに、`RequireAppOpen` に防御を追加した
（このガードは全ルートの入口にあり、ここでの例外は白画面になる）。

### その他

- 事前推薦マスを手動評価できなかった（`source === 'PRESURVEY'` を一律除外していた）。
  `is_achieved` が真なら実際に訪問済みで `check_ins` 行も存在するため、除外条件を `booth` の有無だけに変更
- 候補不足で解放されたマス（`is_revealed=1` かつ `booth=null`）が真っ白かつクリック可能だったため、
  「ブースが決まりませんでした」と表示し操作対象から外した。**文言は仕様書に規定が無く、暫定**

## 開発環境

`.env.example` の `VITE_API_BASE_URL` が `localhost` だったため、
**すべての API 呼び出しが一律 210ms を払っていた**。
Windows が先に IPv6（`::1`）を試すのに対し、サーバーが `0.0.0.0`（IPv4のみ）で
待ち受けているためフォールバックに時間がかかる。

| 接続先 | TCP接続 | 合計 |
|---|---|---|
| `localhost:3000` | 210 ms | 219 ms |
| `127.0.0.1:3000` | 1 ms | 5.7 ms |

`127.0.0.1` へ修正済み。根治はサーバー側のデュアルスタック待ち受けだが、
Cloud Run への影響確認が要るため未実施。

## テストの書き方について

このリポジトリの `tests/` は vitest の `environment: 'node'` で、
`@testing-library/react` も入っていない。フックを直接レンダーするテストは書けないため、
状態を持たないロジックを純粋関数（`bingoUnlockQueue` / `checkInFlowView`）へ切り出し、
そちらを単体テストする方針を採った。フックは薄いラッパになっている。

## 関連

- サーバー側の記録: `event-support-server` の `docs/tests/runs/2026-08-25-bingo-dynamic-unlock.md`
- 仕様: [docs/specs/bingo-dynamic-unlock/](../../specs/bingo-dynamic-unlock/README.md)
