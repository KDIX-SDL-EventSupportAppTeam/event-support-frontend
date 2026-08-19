# チェックイン結果の扱い

## レスポンス

[サーバー仕様](../../../../event-support-server/docs/.sdd/06-api/participant-api.md) を正本とする。

```json
{
  "result": "OK" | "ALREADY_VISITED" | "COOLDOWN",
  "checkin_id": "…",
  "booth": { "id": "…", "name": "…" },
  "cooldown_remaining_sec": 0,
  "filled_cell": { "position": 5 } | null,
  "pending_rating": { … } | null,
  "unlocked": false,
  "new_lines": 0,
  "coins_earned": 0
}
```

## 各結果の表示

| 結果 | HTTP | 表示 |
|---|---|---|
| `OK` | 200 | 成功モーダル。`filled_cell` があればどのマスが埋まったかを示す |
| `ALREADY_VISITED` | 409 | **エラーとして赤く出さない。**「このブースは訪問済みです」と穏やかに伝える正常系 |
| `COOLDOWN` | 429 | 「あと N 秒お待ちください」。**ボタンを残り秒数のあいだ無効化する**。カウントダウン表示が望ましい |

**`ALREADY_VISITED` を失敗として扱わないこと。**参加者が同じ QR を二度読むのはごく普通の行動である。

## `filled_cell` が null のとき

解放後にカードへ載っていないブースを訪問した場合（カード外訪問）。

- **「無駄だった」と感じさせる表示をしないこと**
- チェックイン自体は成功しており、記録もされている。評価も同じように聞く
- ビンゴが進まないことを積極的に説明する必要はない。事実として進まないだけである

これは設計上の既知のトレードオフである。ビンゴゲームという制約がある以上やむを得ないものとして受け入れている。

## 解放時

`unlocked === true` のときは、成功モーダルを閉じたあとに[解放演出](../02-bingo-card/unlock-animation.md)へ遷移する。演出後にカードを再取得する。
