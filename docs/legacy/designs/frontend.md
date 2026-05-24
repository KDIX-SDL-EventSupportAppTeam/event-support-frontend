# フロントエンド設計

**スタック:** React + TypeScript + Zustand + CSS Modules

画面構成・ディレクトリ・層の責務・オフライン・WebSocket です。

**関連:** [設計インデックス](./README.md) · [システム・サーバー設計](./system-server.md) · [DB設計](./database.md) · [API設計](./api.md) · [レビュー観点](./open-questions.md)

## 25. 設計方針

クリーンアーキテクチャのエッセンスを取り入れた軽量な3層設計を採用する。フロントエンドの責務は「APIを呼んで表示する」ことに集中し、ビジネスロジックはバックエンド・推薦エンジン側に集約する。

```
pages/          画面単位のコンポーネント（ルーティングの単位）
components/     再利用可能なUIパーツ
    ↕
hooks/          状態管理・データ取得ロジック（UseCase相当）
    ↕
api/            APIクライアント（Repository相当）
stores/         グローバル状態（Zustand）
```

CSS Modulesを採用し、JSとCSSを別ファイルに分離する。コンポーネントごとに`.module.css`ファイルを持つことでスコープを担保する。

---

## 26. ディレクトリ構成

```
src/
├── api/                    # APIクライアント層
│   ├── client.ts           # axiosインスタンス・共通設定
│   ├── auth.ts
│   ├── booths.ts
│   ├── checkins.ts
│   ├── recommendations.ts
│   ├── survey.ts
│   └── admin.ts
│
├── stores/                 # グローバル状態（Zustand）
│   ├── authStore.ts        # 認証状態・ユーザー情報
│   ├── eventStore.ts       # 現在のイベント情報
│   └── socketStore.ts      # WebSocket接続状態
│
├── hooks/                  # カスタムフック（UseCase相当）
│   ├── useAuth.ts
│   ├── useBooths.ts
│   ├── useCheckin.ts       # チェックイン処理・オフラインキュー
│   ├── useRecommendations.ts
│   ├── useSurvey.ts
│   ├── useSocket.ts        # WebSocket接続管理
│   └── useAdmin.ts
│
├── pages/                  # 画面単位コンポーネント
│   ├── LoginPage/
│   ├── SurveyPage/
│   ├── HomePage/
│   ├── BoothListPage/
│   ├── BoothDetailPage/
│   ├── ScanPage/
│   └── admin/
│       ├── DashboardPage/
│       ├── ParticipantsPage/
│       ├── BoothManagePage/
│       ├── SurveyManagePage/
│       └── CategoryManagePage/
│
├── components/             # 再利用可能なUIパーツ
│   ├── common/
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── Loading/
│   │   └── ErrorMessage/
│   ├── booth/
│   │   ├── BoothCard/
│   │   ├── BoothLabel/
│   │   └── BoothRatingModal/
│   ├── recommendation/
│   │   └── RecommendationPanel/
│   ├── checkin/
│   │   ├── QRScanner/
│   │   └── ManualCodeInput/
│   └── admin/
│       ├── StatsCard/
│       ├── BoothHeatmap/
│       └── CheckinTimeline/
│
├── router/
│   └── index.tsx           # ルーティング定義・ガード
│
├── types/                  # 型定義（APIレスポンスと一致させる）
│   ├── booth.ts
│   ├── checkin.ts
│   ├── recommendation.ts
│   ├── survey.ts
│   └── user.ts
│
├── utils/
│   ├── offlineQueue.ts     # オフラインキュー管理
│   └── formatters.ts
│
└── sw.ts                   # Service Worker
```

各pageディレクトリは`PageName.tsx`と`PageName.module.css`の2ファイル構成とする。

---

## 27. 画面一覧とルーティング

### 参加者向け

| 画面 | パス | 認証 | 説明 |
|------|------|------|------|
| ログイン | `/login` | 不要 | メアド＋パスワード・Googleログイン |
| アンケート | `/survey` | 必要 | 初回のみ。回答済みの場合はホームにリダイレクト |
| ホーム | `/home` | 必要 | 推薦3択・直近のチェックイン履歴 |
| ブース一覧 | `/booths` | 必要 | 全ブース・カテゴリフィルタ |
| ブース詳細 | `/booths/:id` | 必要 | ブース詳細・特性ラベル・統計 |
| QRスキャン | `/scan` | 必要 | カメラ起動・手動コード入力フォールバック |

### 運営向け

| 画面 | パス | 認証 | 説明 |
|------|------|------|------|
| ダッシュボード | `/admin/dashboard` | 管理者 | リアルタイム集計・タイムライン |
| 参加者一覧 | `/admin/participants` | 管理者 | 属性・チェックイン行動一覧 |
| ブース管理 | `/admin/booths` | 管理者 | QRコード確認・手動編集 |
| 設問管理 | `/admin/survey` | 管理者 | イベント固有設問の追加・編集・削除 |
| カテゴリ管理 | `/admin/categories` | 管理者 | カテゴリの追加・削除 |

### ルートガード

```
未認証             → /login 以外 → /login にリダイレクト
アンケート未回答   → /survey 以外 → /survey にリダイレクト
管理者でない       → /admin/* → /home にリダイレクト
```

---

## 28. 各層の責務

### api層
axiosをラップしたAPIクライアント。JWTトークンの付与・エラーハンドリングを共通化する。

### stores層（Zustand）
グローバルで保持すべき最小限の状態のみ管理する。サーバーから取得するデータはhooks側で管理する。
- 保持するもの：`token` / `user` / `isAuthenticated` / WebSocket接続状態
- 保持しないもの：ブース一覧・推薦結果（hooks側で管理）

### hooks層
APIの呼び出し・ローディング状態・エラー状態の管理を集約する。pagesやcomponentsはhooksを呼ぶだけで良い状態にする。

### pages層
ルーティングの単位。レイアウトとhooksの接続のみを担当し、細かいUIはcomponentsに委譲する。

### components層
再利用可能なUIパーツ。propsで必要なデータを受け取り、自分でAPIを叩かない設計にする。

---

## 29. 主要画面のコンポーネントツリー

### ホーム画面（/home）
```
HomePage
  ├── RecommendationPanel     推薦3択の表示・選択
  │     └── BoothCard × 3
  └── CheckinHistory          直近のチェックイン履歴
```

### QRスキャン画面（/scan）
```
ScanPage
  ├── QRScanner
  ├── ManualCodeInput
  └── BoothRatingModal        チェックイン成功後に表示
        └── 5段階評価 + スキップボタン
```

### 管理ダッシュボード（/admin/dashboard）
```
DashboardPage
  ├── StatsCard × 3           総参加者数・総チェックイン数・平均チェックイン数
  ├── CheckinTimeline         時系列グラフ
  └── BoothStatsTable         リアルタイムWebSocket更新
```

---

## 30. オフラインキューの設計

Service Worker（`sw.ts`）とIndexedDBを組み合わせてオフライン時のチェックインを管理する。

```
QRスキャン成功
  ↓ offlineQueue.ts がIndexedDBに保存
  ↓ 画面上は即座に「チェックイン済み」と表示
  ↓ バックグラウンドでサーバーへ送信
成功 → IndexedDBから削除
失敗 → exponential backoffでリトライ
長時間失敗 → ユーザーに通知
```

---

## 31. WebSocket接続管理

`useSocket.ts`でsocket.ioの接続を管理し、受け取ったイベントをstoreまたはhooksの状態に反映する。

```
useSocket.ts
  ├── recommendation:updated → useRecommendations の状態を更新
  ├── booth:label:updated    → useBooths の状態を更新
  └── dashboard:*            → useAdmin の状態を更新（運営のみ）
```

---

## 32. 技術スタック一覧

| 用途 | 技術 |
|------|------|
| UIフレームワーク | React + TypeScript |
| ルーティング | React Router v6 |
| 状態管理 | Zustand |
| スタイリング | CSS Modules |
| HTTPクライアント | axios |
| WebSocket | socket.io-client |
| QRスキャン | html5-qrcode |
| オフライン対応 | Service Worker + IndexedDB |
| ビルドツール | Vite |
| デプロイ | Vercel |

---

## 付録: 現行リポジトリ実装との差分（2026-05）

本書はグリーンフィールド向けの構成（CSS Modules・`api/booths.ts` 等）を記述している。現状の **`frontend/`** は次のとおり **旧 Vue 準拠のリプレイス** が優先されている。

| 本書の記述 | 実装側の実態 |
|------------|----------------|
| CSS Modules 中心 | Bootstrap + SCSS（`legacy-*.scss`）中心 |
| `api/booths.ts` 等の v1 クライアント | 認証は `api/auth.ts` + unwrap。ブース・ビンゴは `api/legacyParticipant.ts`（`/api/*`）と `POST /checkin` |
| 単一データ層 | ホーム等は `EventDataSource`、ガチャ・チェックイン・投票等は `ParticipantClient`（`createParticipantClient`）に分離 |
| ディレクトリ例 | `pages/` 配下に Home・BoothList・Gachapon・CheckIn・AwardVote・Schedule・Q&A 等 |

設計書を本流に戻す場合は、[designs/README.md の実装メモ節](./README.md) と [docs/adrs/](../adrs/) を先に更新すること。
