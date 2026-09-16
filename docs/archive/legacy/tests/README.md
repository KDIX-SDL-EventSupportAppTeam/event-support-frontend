# テスト記録（`docs/tests`）

`tests/` で実行したテストの目的・理由・結果を、作業の区切りごとに `runs/` 以下へ残す。

## 記載の目安

- **何を**: 対象ファイル・コマンド
- **なぜ**: 設計ドキュメントや不具合との対応
- **結果**: 成功 / 失敗ログの要約・再現手順

## フィクスチャ（ダミーデータ）

| ファイル | 内容 |
|----------|------|
| [fixtures/dummy-login.md](./fixtures/dummy-login.md) | ローカル用のイベント ID・メール・パスワード例と `.env` との対応 |

## 記録一覧

| 日付 | ファイル | 概要 |
|------|-----------|------|
| 2026-05-12 | [runs/2026-05-12-frontend-rewrite-smoke.md](./runs/2026-05-12-frontend-rewrite-smoke.md) | フロント書き換え後のスモーク |
| 2026-05-13 | [runs/2026-05-13-mock-auth.md](./runs/2026-05-13-mock-auth.md) | モック認証まわりの Vitest |
| 2026-05-13 | [runs/2026-05-13-event-data-source.md](./runs/2026-05-13-event-data-source.md) | SampleEventData・データソース切替の Vitest |
| 2026-05-13 | [runs/2026-05-13-docs-sync-verification.md](./runs/2026-05-13-docs-sync-verification.md) | ドキュメント更新後の `frontend` lint/build とルート Vitest |
