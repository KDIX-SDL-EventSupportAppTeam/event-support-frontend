# ドキュメント

文書は**寿命**で分けている。運用ルールは [rules/documentation.md](rules/documentation.md) が正本。

| ディレクトリ | 問い | 中身 |
|---|---|---|
| [specs/](specs/) | 今どうあるべきか | 機能ごとの UI 仕様（正本） |
| [reference/](reference/) | 今どうなっているか | ディレクトリ構成・データ層・開発/デプロイ手順 |
| [rules/](rules/) | 何を守るか | Git・実装・テスト・ドキュメントの規約 |
| [decisions/](decisions/) | なぜそうなったか | ADR・議事録（追記のみ） |
| [tests/](tests/) | 何を確かめたか | テスト実行記録・フィクスチャ |
| [archive/](archive/) | 昔どうだったか | 退役した文書（**参照しない**） |
| [ubiquitous-language.md](ubiquitous-language.md) | 言葉の意味 | ドメイン用語 |

> **API 契約・DB スキーマ・ビジネスルールの正本は `event-support-server` の `docs/specs/`。**
> こちらには UI の仕様だけを書く。サーバー側の内容をコピーしない。

## 定期整理

合言葉「**棚卸し**」。手順は [rules/documentation.md](rules/documentation.md#棚卸し) にある。
