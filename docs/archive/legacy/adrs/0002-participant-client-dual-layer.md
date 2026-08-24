# ADR 0002: 参加者周辺機能を ParticipantClient に分離する

- **日付:** 2026-05-13  
- **ステータス:** 採用  

## 状況

ホームのブース・ビンゴ取得には `EventDataSource` を導入済みだったが、ガチャポン・QR チェックイン・アワード投票・スケジュール・Q&A など **旧 Flask 由来のエンドポイント群** を同じインタフェースに載せると肥大化し、`sample` 実装のセッション追補とも相性が悪い。

## 決定

- **`ParticipantClient`**（`frontend/src/data/participantTypes.ts`）を新設し、`createParticipantClient()` で `sample` / `api` を切り替える。
- `EventDataSource` は従来どおり **ブース一覧・ビンゴグリッド・チェックイン ID 一覧（ホーム用）** に限定する。

## 結果

- API モードでは `api/legacyParticipant.ts` と `POST /checkin` を集中利用する。
- サンプルモードでは `sampleSession.ts` でチェックイン追補・ガチャ消費・投票を `sessionStorage` に保持し、`SampleEventData` の決定論データと合成する。

## 代替案（却下理由）

- `EventDataSource` にすべて集約: インタフェースが肥大化し、テストとモックの境界が曖昧になる。
