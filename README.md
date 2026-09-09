# event-support-frontend

参加者・運営向け UI。React 19 + TypeScript + Vite + Zustand + axios。

## アーキテクチャ

### このリポジトリの責任

参加者・運営向け UI の描画と、ユーザー操作のハンドリングを担う。
ビジネスロジック・データ集計・推薦アルゴリズムは持たず、
すべて `event-support-server` の API を経由して行う。

**担当すること**

- 全画面の React コンポーネント
- Fastify `/api/v1` への API 呼び出し
- Zustand による UI 状態管理
- 認証トークン（JWT）の保持と付与
- PWA・Service Worker・オフラインキュー（将来）
- QR コードスキャン（将来）

**担当しないこと**

- ビジネスロジック・データ集計
- データベースへの直接アクセス
- 推薦アルゴリズム
- `event-support-recommender` への直接通信（必ず server 経由）

---

### 他サービスとの関係

```
[event-support-frontend]
        │
        │ HTTPS REST API（/api/v1）
        │ WebSocket（リアルタイム推薦・ダッシュボード）
        ▼
[event-support-server]
```

---

### ディレクトリ構造

```
src/
├── features/          # ドメインごとに完結したモジュール
│   ├── auth/          # ログイン・新規登録・認証状態管理
│   ├── home/          # ホーム画面・ビンゴ
│   ├── booth/         # ブース一覧
│   ├── checkin/       # チェックイン・評価・推薦表示
│   ├── gachapon/      # ガチャポン
│   ├── award/         # アワード投票
│   ├── schedule/      # スケジュール
│   ├── qa/            # Q&A
│   ├── admin/         # 運営ダッシュボード・CRUD
│   └── organizer/     # 主催者ポータル（guards / pages / store / api / components）
├── shared/            # 複数 feature をまたいで使うもの
│   ├── api/           # axios クライアント・共通エラー処理
│   ├── auth/          # 認証セッション（authStore・AuthUser 型・モック判定）
│   ├── data/          # EventDataSource / ParticipantClient（移行期）
│   ├── hooks/         # 共通 hooks
│   ├── types/         # 共通型
│   ├── lib/           # ユーティリティ
│   └── styles/        # グローバル SCSS
├── router/
│   └── index.tsx
├── App.tsx
└── main.tsx
```

**原則：feature をまたいだ直接 import を禁止する。
feature 間で共有が必要なものは `shared/` に置く。**

---

## ローカル開発

```bash
cp .env.example .env   # VITE_API_BASE_URL・VITE_MOCK_API・VITE_DATA_SOURCE を設定
npm install
npm run dev            # http://localhost:5173
```

実 API に接続する場合は `.env` に `VITE_DATA_SOURCE=api` を指定する。  
WebSocket の接続先は独立した環境変数を持たず、`VITE_API_BASE_URL` から自動導出される
（`src/shared/api/socket.ts` の `resolveSocketBaseUrl`）。

```bash
npm run build          # 本番ビルド
npm run preview        # ビルド成果物のプレビュー
npm run lint           # ESLint
```

本番ビルドは環境変数が不正だと失敗する（`docs/reference/development.md` 参照）。

---

## ユビキタス言語

参加者・ブース・チェックイン・推薦などの用語は [docs/ubiquitous-language.md](./docs/ubiquitous-language.md) を正とする。コード・ドキュメント・会話すべてでこの語彙を統一して使う。

---

## 関連リポジトリ

| リポジトリ | 役割 |
|---|---|
| `event-support-server` | REST API・WebSocket |
| `event-support-recommender` | 推薦エンジン（server 経由） |
