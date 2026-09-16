# 実装規約（React / TypeScript）

## 境界（守ること）

| やる | やらない |
|---|---|
| 画面描画・ユーザー操作のハンドリング | ビジネスロジック・データ集計 |
| `event-support-server` 経由の REST / WebSocket | DB への直接アクセス |
| JWT の保持とリクエストへの付与 | `event-support-recommender` への直接通信 |

推薦結果・集計値は、必ず server の API レスポンスをそのまま表示するだけに留める。
**フロントで計算し直さない。**

## 構成

- **feature 間の直接 import は禁止。** 共有するものは `src/shared/` に置く
- 認証セッション（token・user・ロール判定）は `shared/auth/` に置く。
  `features/auth/` には画面と認証 API フローだけを残す
  （[ADR 0003](../decisions/adrs/0003-move-auth-session-to-shared.md)）
- API 呼び出しは `shared/api/` 経由。画面コンポーネントに axios を直書きしない
- スタイルは feature 固有なら `features/*/styles/`、共通は `shared/styles/`

## TypeScript

- strict。`any` は避ける
- パスエイリアス `@/` → `src/`
- API レスポンスの型は `shared/api/` に、ドメイン型は `shared/types/` に置く

## 本番ビルド

`npm run build` ではモック認証が無効化され、開発用の初期値
（ログイン・登録フォームの事前入力）も一切表示されない。この挙動を壊さない。

## 命名

ドメイン用語は [docs/ubiquitous-language.md](../ubiquitous-language.md) を正本とする。
