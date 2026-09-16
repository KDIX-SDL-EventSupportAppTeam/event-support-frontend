---
状態: 草案
最終更新: 2026-08-24
---

# 合格基準（UI）

自動化する範囲は [rules/testing.md](../../../rules/testing.md) を参照。
画面の見た目・カメラ・実機の電波は自動化せず、実機リハーサルで確認する
（`event-support-server/docs/specs/bingo-dynamic-unlock/10-testing/rehearsal-plan.md`）。

## カード表示

- [ ] `cells` 16件が4×4に並ぶ
- [ ] `is_revealed: false` のマスにブース名が表示されない
- [ ] `is_revealed: true, is_achieved: false` のマスにブース名とブース説明が表示される
- [ ] `is_revealed: true, is_achieved: true` のマスに達成マークが出る
- [ ] 進捗表示がサーバーの `progress` と一致する（フロントで数え直していない）
- [ ] コインの枚数が表示されない
- [ ] 推薦理由文が表示されない

## 解放演出

- [ ] チェックインレスポンスの `unlocked_positions` が空でないとき演出が出る
- [ ] 空配列のとき演出が出ない
- [ ] **1回目・2回目・3回目それぞれで演出が出る**
- [ ] 同じ `pair_key` の演出が2回出ない
- [ ] 演出中に画面を離れても、次にカードを開いたときに未再生の演出が出る
- [ ] socket が届かなくても、チェックインレスポンス経由で演出が出る
- [ ] 演出をスキップできる

## 評価モーダル

- [ ] `pending_rating` が非 null のとき評価ステップが先頭に出る
- [ ] 星の数がサーバーの `rating_scale`（4）と一致する
- [ ] コメント欄がある
- [ ] ボタンが「完了」1つだけ
- [ ] 星未選択で完了してもエラーにならず、次のステップへ進む
- [ ] 評価の送信に失敗してもチェックイン成功の表示が消えない
- [ ] マスのタップから手動評価できる（`context: 'MANUAL'`）

## チェックイン

- [ ] `filled_cell` が null のとき、カードに載らなかったことが分かる
- [ ] それでも評価は求められる
- [ ] 同じブースへの2回目で 409 を受けても画面が壊れない

## 削除の確認

- [ ] `CheckInRecommendView` が存在しない
- [ ] `ReasonPanel` が存在しない
- [ ] `legacyHttp.ts` / `legacyParticipant.ts` が存在しない
- [ ] `/gachapon` `/award-vote` が「準備中」表示になる
- [ ] `unlocked`（真偽値）や `coins_earned` を参照しているコードが無い
- [ ] `npm run build` と `npm run lint` が通る

## サンプルモード

- [ ] `VITE_DATA_SOURCE=sample` で、段階解放の各状態を再現できる
- [ ] サンプルデータで解放演出を3回とも確認できる
