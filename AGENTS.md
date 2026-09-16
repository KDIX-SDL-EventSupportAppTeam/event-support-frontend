# event-support-frontend

イベント支援アプリの UI（React 19 + TypeScript + Vite + Zustand + axios + Bootstrap/SCSS）。
概要は [README.md](./README.md)。

## 最初に読むもの

| 知りたいこと | 見る場所 |
|---|---|
| これから何を作るのか | [docs/specs/](./docs/specs/README.md) — **UI 仕様の正本** |
| 今どうなっているのか | [docs/reference/](./docs/reference/README.md) — 構成・データ層・開発手順 |
| 何を守るのか | [docs/rules/](./docs/rules/README.md) — Git・実装・テスト・ドキュメント |
| なぜそうなったのか | [docs/decisions/](./docs/decisions/README.md) — ADR・議事録 |
| 言葉の意味 | [docs/ubiquitous-language.md](./docs/ubiquitous-language.md) |

`docs/archive/` は退役した文書。**参照しない。**

## 絶対に守ること

1. **`main` を直接触らない。** 作業ブランチ → `develop` へ PR を出す。
   `develop` → `main` は明示的に指示されたときだけ（[rules/git.md](./docs/rules/git.md)）
2. **API 契約・DB スキーマ・ビジネスルールの正本は `event-support-server` の `docs/specs/`。**
   こちらにコピーせず、リンクで参照する
3. **フロントで計算しない。** 推薦結果・集計値・進捗はサーバーのレスポンスをそのまま表示する
4. **feature 間の直接 import 禁止。** 共有は `src/shared/` に置く
5. **「状態: 確定」でない仕様は実装しない**
6. コミット・PR は**日本語**。テストコードは `tests/` に置き、`src/` に `*.test.ts` を置かない

## よく使うコマンド

```bash
npm run dev     # http://localhost:5173（既定はサンプルデータ）
npm test        # Vitest
npm run build   # 本番ビルド（モック認証は無効化される）
npm run lint
```

## 関連リポジトリ

| リポジトリ | 役割 |
|---|---|
| `event-support-server` | API・WebSocket の提供元。**仕様の正本** |
| `event-support-recommender` | 推薦エンジン。**フロントから直接呼ばない**（server 経由） |
