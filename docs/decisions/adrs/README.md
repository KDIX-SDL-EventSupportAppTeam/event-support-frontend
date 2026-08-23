# ADR（Architecture Decision Records）

フロントエンドにおける設計判断を記録する。新規 ADR はこのディレクトリに追加する（`docs/archive/legacy/adrs/` には追加しない）。

## ファイル名

```
NNNN-kebab-case-title.md
```

- `NNNN`: 4 桁の連番（例: `0001`, `0002`）
- 既存の最大番号 + 1 を使う（legacy の ADR 番号と重複してもよい）

## テンプレート

[_template.md](./_template.md) をコピーして作成する。

## 一覧

| 番号 | ファイル | 概要 | ステータス |
|------|----------|------|------------|
| 0001 | [0001-features-shared-directory.md](./0001-features-shared-directory.md) | features + shared ディレクトリ移行 | 採用 |
| 0002 | [0002-top-redirects-to-organizer-login.md](./0002-top-redirects-to-organizer-login.md) | トップ `/` をオーガナイザーログインにリダイレクト | 採用 |
| 0003 | [0003-move-auth-session-to-shared.md](./0003-move-auth-session-to-shared.md) | 認証セッションを shared/auth に配置 | 採用 |

## レガシー

モノレポ時代の ADR は [docs/archive/legacy/adrs/](../../archive/legacy/adrs/) を参照。
