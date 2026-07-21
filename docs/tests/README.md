# テスト（`docs/tests`）

このリポジトリのテストは **コード** と **ドキュメント** を分けて管理する。

| 場所 | 役割 |
|------|------|
| [`tests/`](../../tests/) | Vitest のテストコード（`unit/`・`integration/`） |
| `docs/tests/runs/` | 実行記録（何を・なぜ・結果） |
| `docs/tests/fixtures/` | ダミーデータ・ログイン例・再現用の固定値 |

テストコードは **`tests/` にまとめる**。`src/` 内に `*.test.ts` を置かない。
実行後は必ず `docs/tests/runs/` に記録を残し、本ファイルの「記録一覧」を更新する。

詳細なコマンド・エイリアス設定は [tests/README.md](../../tests/README.md) を参照。

---

## テストするときの流れ

1. [`tests/unit/`](../../tests/unit/) または [`tests/integration/`](../../tests/integration/) に `*.test.ts` を追加・変更
2. ルートで lint / ビルド、テストを実行

   ```bash
   npm run lint
   npm run build
   cd tests && npm install && npm test
   ```

3. [runs/_template.md](./runs/_template.md) をコピーし、`docs/tests/runs/YYYY-MM-DD-kebab-case-summary.md` を作成
4. 記録に **対象 `src/` ファイル** と **`tests/**/*.test.ts` のパス** を書く
5. 下記「記録一覧」を 1 行追加

PR 作成時は [AGENTS.md](../../AGENTS.md) の「次にやること」も合わせて更新する。

---

## ディレクトリ

| パス | 用途 |
|------|------|
| [runs/](./runs/) | 実行記録（1 回の作業 = 1 ファイル） |
| [fixtures/](./fixtures/) | 再現用の固定値（ログイン例・event_id 等） |

### ファイル名（runs）

```
YYYY-MM-DD-kebab-case-summary.md
```

### テンプレート

[runs/_template.md](./runs/_template.md)

---

## 記載の目安（runs）

| 項目 | 書くこと |
|------|----------|
| **何を** | 対象 `src/` ファイル、追加・変更した `tests/**/*.test.ts`、実行コマンド |
| **なぜ** | 対応する Issue / ADR / 不具合 |
| **結果** | 成功 / 失敗の要約。失敗時はログ抜粋と再現手順 |
| **環境** | ブランチ、`sample` / `api`、関連 PR / Issue |

---

## 現在のテストコード一覧

`tests/` に存在するテストと、主な対象 `src/` の対応。

| テストコード | 種別 | 主な対象（src） |
|--------------|------|-----------------|
| [tests/unit/api-unwrap.test.ts](../../tests/unit/api-unwrap.test.ts) | unit | `src/shared/api/unwrap.ts` |
| [tests/unit/auth-mock.test.ts](../../tests/unit/auth-mock.test.ts) | unit | `src/features/auth/mocks/authMock.ts`, `devDummyCredentials.ts` |
| [tests/unit/bingo-random.test.ts](../../tests/unit/bingo-random.test.ts) | unit | `src/shared/data/sample/bingoRandom.ts` |
| [tests/unit/sample-event-data.test.ts](../../tests/unit/sample-event-data.test.ts) | unit | `src/shared/data/sample/SampleEventData.ts`, `createEventDataSource.ts` |
| [tests/unit/resolve-landing-path.test.ts](../../tests/unit/resolve-landing-path.test.ts) | unit | `src/features/auth/lib/resolveLandingPath.ts` |
| [tests/unit/auth-role-helpers.test.ts](../../tests/unit/auth-role-helpers.test.ts) | unit | `src/shared/auth/authStore.ts`（`isAdminUser` / `isManagerUser`） |
| [tests/unit/exhibitor-store.test.ts](../../tests/unit/exhibitor-store.test.ts) | unit | `src/features/exhibitor/store/exhibitorStore.ts` |
| [tests/integration/frontend-package.test.ts](../../tests/integration/frontend-package.test.ts) | integration | ルート `package.json`（build スクリプト） |

新規テストを追加したら、この表も更新する。

---

## 記録一覧

| 日付 | ファイル | 概要 | テストコード |
|------|----------|------|--------------|
| 2026-05-24 | [runs/2026-05-24-features-shared-refactor.md](./runs/2026-05-24-features-shared-refactor.md) | features/shared 移行後の lint/build/test | 全 unit + integration |
| 2026-07-11 | [runs/2026-07-11-auth-exhibitor-unit-tests-restore.md](./runs/2026-07-11-auth-exhibitor-unit-tests-restore.md) | tests/ 実行復旧＋出展者・ログイン分岐の単体テスト追加 | resolve-landing-path, auth-role-helpers, exhibitor-store（新規）＋既存8ファイル |

---

## フィクスチャ（fixtures）

ローカル開発・テスト再現に使う固定値は `docs/tests/fixtures/` に置く。
モノレポ移行時の例は legacy を参照し、新規はこちらに追加する。

| ファイル | 内容 |
|----------|------|
| （まだなし） | — |

**レガシー参照:** [docs/legacy/tests/fixtures/dummy-login.md](../legacy/tests/fixtures/dummy-login.md)（event_id・ログイン例）

---

## レガシー

モノレポ時代の実行記録は [docs/legacy/tests/](../legacy/tests/) に退避済み。新規記録は `docs/tests/runs/` に追加し、legacy には書かない。

| 日付 | ファイル | 概要 |
|------|----------|------|
| 2026-05-12 | [runs/2026-05-12-frontend-rewrite-smoke.md](../legacy/tests/runs/2026-05-12-frontend-rewrite-smoke.md) | フロント書き換え後のスモーク |
| 2026-05-13 | [runs/2026-05-13-mock-auth.md](../legacy/tests/runs/2026-05-13-mock-auth.md) | モック認証まわりの Vitest |
| 2026-05-13 | [runs/2026-05-13-event-data-source.md](../legacy/tests/runs/2026-05-13-event-data-source.md) | SampleEventData・データソース切替 |
| 2026-05-13 | [runs/2026-05-13-docs-sync-verification.md](../legacy/tests/runs/2026-05-13-docs-sync-verification.md) | lint / build / Vitest |

---

## 関連ドキュメント

- [tests/README.md](../../tests/README.md) — テストコードの置き場所・コマンド
- [AGENTS.md](../../AGENTS.md) — エージェント向けテスト規約
- [docs/adrs/](../adrs/) — 設計判断（テスト方針の ADR はここへ）
