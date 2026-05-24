# Event Support — フロントエンド

React + TypeScript + Vite。旧 Vue アプリの画面・ルートを維持したリプレイス。詳細は `frontend/AGENTS.md`。

```bash
npm install
npm run dev
npm run build
```

ローカル用のログイン例は [docs/tests/fixtures/dummy-login.md](../docs/tests/fixtures/dummy-login.md)。**`npm run dev` では既定でモック認証**（バックエンド不要）。実 API に繋ぐときは `.env` に `VITE_MOCK_API=false`。

**データ:** 既定は `sample`。`VITE_DATA_SOURCE=api` ではブース・ホームが Fastify `/api/v1`（`VITE_MOCK_API=false` 時）。ガチャ・投票等はまだ旧 Flask 経路。詳細は `frontend/AGENTS.md`。
