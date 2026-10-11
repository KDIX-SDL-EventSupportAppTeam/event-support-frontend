# event-support-server への依頼: 出展者一覧 API・ロール変更 API の新設

> **状態: server 側で実装済み**（event-support-server PR #185。契約の正本は server の
> `docs/specs/exhibitor-list-and-role-change/README.md`）。暫定契約からの差分は、同時更新時の 409 の追加のみ。
> 以下は依頼時点の記録。

> このファイルは `event-support-server` で作業するエージェントに渡すプロンプト。
> 契約の正本は実装後の server 側 `docs/specs/` になる。フロントはこの暫定契約で実装済み
> （`src/shared/api/v1Admin.ts` の `fetchAdminExhibitors` / `patchAdminUserRole`）。

---

## 背景

運営画面に次の2つを追加した（フロントは実装済み）。

1. **出展者一覧**（`/admin/exhibitors`）: 登録済みの出展者をブースごとにまとめ、ブース番号順に表示する。1つのブースに複数の出展者がいることがあり、1人の出展者が複数のブースを担当することもある（`exhibitor_booths` は多対多）
2. **ロール変更**: 参加者一覧では「参加者 → 出展者」、出展者一覧では「出展者 → 参加者」に変更できる。**manager のみ**が変更できる

今のサーバーには、出展者を一覧で返す API も、出展者を参加者に戻す API もない（出展者まわりは `POST /admin/events/:event_id/exhibitors/bulk` だけ）。この2本を新しく作ってほしい。

## 作るもの

### 1. `GET /admin/events/:event_id/exhibitors`

- 権限: 運営（viewer 以上。閲覧のみなので viewer も可。既存の admin 系の閲覧 API に合わせる）
- 対象: `users.event_id = :event_id AND users.role = 'exhibitor'`
- **ブース単位にまとめ、並び順もサーバーで決める**。フロントは並べ替えをしない（フロントの AGENTS.md 原則3「フロントで計算しない」）
  - `booths` はブース番号（`booths.display_code`）の**自然順**（`'2' < '10'`）で並べる。`display_code` が null のブースは末尾に置き、ブース名順にする
  - 出展者が1人もいないブースは**含めない**
  - 各ブースの `exhibitors` はメールアドレスの昇順
  - どのブースにも紐付いていない `role='exhibitor'` のユーザーは `unassigned` に入れる
  - 複数のブースを担当する出展者は、それぞれのブースに重複して出てよい
- レスポンス（既存の `{ data: ... }` エンベロープに従う）:

```json
{
  "data": {
    "booths": [
      {
        "booth_id": "uuid",
        "booth_name": "近畿大学 須藤ゼミ",
        "display_code": "1",
        "exhibitors": [
          { "user_id": "uuid", "email": "a@example.com", "display_name": "山田", "created_at": "2026-10-01T00:00:00.000Z" }
        ]
      }
    ],
    "unassigned": [
      { "user_id": "uuid", "email": "b@example.com", "display_name": null, "created_at": "..." }
    ]
  }
}
```

### 2. `PATCH /admin/events/:event_id/users/:user_id/role`

- 権限: **manager のみ**（viewer は 403）
- リクエスト本文は次のどちらか:
  - 参加者 → 出展者: `{ "role": "exhibitor", "booth_ids": ["uuid", ...] }`（`booth_ids` は1件以上が必須）
  - 出展者 → 参加者: `{ "role": "participant" }`
- 処理:
  - 対象ユーザーが同じイベントにいない場合は 404
  - 参加者 → 出展者: 今が `role='participant'` のときだけ受け付ける。`users.role='exhibitor'` に更新し、`exhibitor_booths` に紐付けを作る。ブースが同じイベントのものかどうかを検証する（違えば 400 か 404）。すでに紐付いているブースはスキップする（冪等）。パスワードは上書きしない。既存の `exhibitors/bulk` の昇格処理（`src/routes/v1/admin/exhibitors.ts` の participant 昇格まわり）を流用してよい
  - 出展者 → 参加者: 今が `role='exhibitor'` のときだけ受け付ける。`users.role='participant'` に更新し、そのユーザーの `exhibitor_booths` を**すべて削除**する
  - 今のロールが変更前として想定と違う場合（例: すでに exhibitor なのに exhibitor を指定、manager/viewer を対象にした）は 409 か 400。**運営アカウント（manager/viewer/admin）のロールはこの API で変えられないようにする**
  - 可能なら1トランザクションで行う（getConnection に対応していない環境では既存 bulk と同じ方針で、失敗を報告する）
  - 監査ログ（audit-logs）に、誰が誰のロールを何から何に変えたかを残す
- レスポンス: `{ "data": { "user_id": "uuid", "role": "exhibitor" | "participant" } }`

## 確認・決めてほしいこと（実装前に報告してほしい）

1. **ロール変更後のトークン**: 変更されたユーザーが持っている JWT の `role` は古いままになる。再ログインが必要か、各 API が DB の role を見ているので問題ないかを確認し、結果を報告してほしい（出展者画面の API が古い exhibitor トークンで通り続けないかどうか）
2. **出展者が参加者として残しているデータ**: 参加者→出展者にしたとき、チェックイン・評価・アンケート回答・投票をそのまま残すか。いまは残す想定でよい
3. **出展者→参加者にしたときの事前アンケート**: 未回答だと参加者画面の入口でアンケートに回答させられる。これで問題ないか
4. **出展者も参加者画面を使えるようになった**: フロントで、出展者が参加者画面（ホーム・チェックイン・ビンゴなど）に入れるようにした。参加者向け API（`/events/:event_id/...`）が `role='exhibitor'` のトークンを拒否していないか確認し、拒否している API があれば受け付けるように直してほしい（出展者は事前アンケートの対象外）

## 完了条件

- 2本の API の実装とテスト（権限: viewer/manager/participant、正常系、404/409、冪等性、他イベントのブース指定）
- `docs/specs/` に API 契約を追記する（正本はサーバー側）
- 上の「確認・決めてほしいこと」への回答
