# SDD: 2026-07-02 コードレビュー是正（フロントエンド）

2026-07-02 実施のコードレビュー・ドキュメント整合性監査で検出された問題の是正仕様書。
サーバー側の是正仕様は `event-support-server/.sdd/2026-07-02-code-review/` を参照。

## 背景

オーガナイザー機能の追加・v1 API 移行が進む一方で、

1. **本番ビルドに開発用資格情報が露出するバグ**（参加登録画面のプリフィル）が存在する
2. 自ら定めた「feature 間の直接 import 禁止」ルールが authStore を中心に広範に破られている
3. README / AGENTS.md の環境変数・ロール表記が実装から乖離している

の 3 系統の問題が確認された。

## ドキュメント構成

| ファイル | 内容 | 優先度 |
|----------|------|--------|
| [01-bugfixes.md](./01-bugfixes.md) | コード修正仕様（本番プリフィル・socket 参照カウント） | **最優先** |
| [02-architecture-auth.md](./02-architecture-auth.md) | 認証状態の依存構造の是正（feature 間 import 違反の解消方針） | 中 |
| [03-docs-consistency.md](./03-docs-consistency.md) | ドキュメント同期仕様（README・AGENTS.md・.env.production.example・コメント） | 中 |

## 対応の優先順位

1. **F-1**（本番プリフィル）— 本番利用者に開発用パスワードが表示される。即時修正
2. **F-2**（socket 参照カウント）— ダッシュボード多重マウント時の接続破壊
3. **A-1**（authStore の配置）— 方針決定（ADR）→ 移動
4. D 項目（ドキュメント同期）

## PR #38 との関係（2026-07-05 追記）

リモートの [PR #38](https://github.com/KDIX-SDL-EventSupportAppTeam/event-support-frontend/pull/38)
（`fix/tk-verification-findings`、develop 宛て）は本 SDD と独立に作成されたもので、以下を含む。

| PR #38 の修正 | 本 SDD との関係 |
|---|---|
| ① 運営ログインが `?event=` を無視し既定イベント宛てにログインする（AdminLoginPage） | **本 SDD のスコープ外だった実バグ**（レビュー時の見落とし）。PR の修正は妥当。仕様追加は不要 |
| ② JoinPage の開発用資格情報プリフィル | **F-1 の部分対応**。RegisterPage・resolve 関数の二重ガード・単体テストが残る（01-bugfixes.md の対応状況を参照） |
| ③ 参加者分析「運営のみ」フィルタが `'admin'` 固定で manager/viewer に不一致 | **本 SDD のスコープ外だった実バグ**。「staff = participant 以外」の判定は新ロール体系・サーバー側 `requireStaff` の語彙とも整合しており妥当 |

**作業順序の指定**: ローカル作業ツリーには F-1 全量 + A-1（`shared/auth/` 移動・ADR 0003）+
D 系を実装した未コミット変更が存在し、PR #38 と 3 ファイル
（AdminLoginPage / ParticipantAnalyticsWindow / JoinPage）で競合する。
**先に PR #38 をマージし、その上にローカル変更をリベース**すること。
競合解消の方針: JoinPage は同内容のため PR 側を採用、AdminLoginPage / ParticipantAnalyticsWindow は
PR 側の修正（`?event=` ログイン・staff フィルタ）と ローカル側の import 変更（`@/shared/auth/`）を両取りする。

## スコープ外

- サーバー側の是正（上記サーバー SDD を参照）
- AGENTS.md「次にやること」に既載の移行タスク（LegacyBooth 解体・checkin API 集約等）は
  本 SDD の対象外（既存のバックログとして継続）
