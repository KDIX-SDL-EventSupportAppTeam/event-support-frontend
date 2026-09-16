# ADR 0001: src を features + shared 構成に移行する

- **日付:** 2026-05-24
- **ステータス:** 採用

## 状況

モノレポ独立後も `src/pages/`・`src/api/` 等のフラット構成のままで、feature 間の依存境界がコード上で表現できていなかった。README / AGENTS.md では `features/` + `shared/` を目標としていた。

## 決定

- `src/features/*` にドメイン単位（auth, home, booth, checkin, gachapon, award, schedule, qa, admin）で pages・store・hooks を配置
- `src/shared/*` に API クライアント、データ層（移行期）、共通 hooks・types・lib・グローバル styles を配置
- feature 間 import 禁止。共有が必要なものは `shared/` へ

## 結果

- 引き継ぎ時に「どの feature が何を担当するか」がディレクトリ名から推測しやすくなる
- 認証は `features/auth/` に集約。`useLegacyBoothList` は booth/checkin 共用のため `shared/hooks/` へ
- データ層（EventDataSource / ParticipantClient）は引き続き `shared/data/` に置き、v1 移行完了後に feature へ分割予定

## 代替案（却下理由）

- 一気に feature 固有 API まで分割: 旧 Flask / v1 混在のデータ層を同時に組み替えるとリスクが大きい
- re-export shim のみ: 旧パスを残すと移行が完了しない
