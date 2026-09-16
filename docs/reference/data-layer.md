---
状態: 実装済み
最終更新: 2026-08-24
---

> **現状の事実を記録する文書。** 「これからどうするか」は [../specs/](../specs/README.md) を見ること。

# データ層（移行期）

`EventDataSource`（`src/shared/data/EventDataSource.ts`）と `ParticipantClient`（`src/shared/data/participantTypes.ts`）が画面から参照するデータ契約。
`createEventDataSource()` / `createParticipantClient()` で実装を切り替える。

| モード | 用途 | 実装 |
|---|---|---|
| `sample`（開発既定） | バックエンド不要で UI 確認 | `src/shared/data/sample/` |
| `api` | 実 server 接続 | `src/shared/data/api/` |

- **認証:** `features/auth/api/auth.ts` — `VITE_MOCK_API=false` 時に `POST /api/v1/auth/login` 等（モックは `features/auth/mocks/`）
- **v1:** ブース・チェックイン等 — `shared/api/v1Participant.ts`
- **legacy:** ガチャ・投票等 — `shared/api/legacyParticipant.ts`（段階的に v1 へ移行予定）
