# 型と API クライアント

## 追加する型

`src/shared/types/` に置く。既存の `legacyBooth.ts` の `BingoGridCell` は**サンプル UI 用として残し、新しい型を別に定義する**（混ぜると legacy 契約が壊れる）。

```ts
export type BingoCellState = 'LOCKED' | 'EMPTY' | 'ACHIEVED'
export type BingoCellZone = 'CENTER' | 'OUTER'
export type BingoCellSource = 'SIGNUP_BONUS' | 'FREE_VISIT' | 'RECOMMEND'

export type BingoCell = {
  position: number                 // 0..15（行優先）
  zone: BingoCellZone
  state: BingoCellState
  source: BingoCellSource | null
  booth: { id: string; name: string; manual_code: string } | null   // LOCKED では必ず null
  reason: { summary: string; detail: string } | null                // 当面は null
}

export type BingoCard = {
  card_id: string
  status: 'CENTER_ONLY' | 'UNLOCKED'
  unlocked_at: string | null
  rating_scale: number
  progress: { center_filled: number; center_total: number; visits_to_unlock: number }
  coins: { earned: number; max: number }
  cells: BingoCell[]               // position 昇順で必ず16件
}
```

**`booth` を non-null にしないこと。**`LOCKED` では必ず `null` である。型で強制することで「解放前に中身を表示する」バグを防ぐ。

## API クライアント

`src/shared/api/v1Participant.ts` に追加する。既存の `fetchV1*` / `postV1*` の命名と `unwrap` の使い方に合わせる。

```ts
export async function fetchV1BingoCard(eventId: string): Promise<BingoCard>
```

既存の `postV1CheckIn` の戻り型 `V1CheckInResponse` を拡張する（`filled_cell` / `pending_rating` / `unlocked` / `new_lines` / `coins_earned` / `cooldown_remaining_sec`）。
`postV1CheckInRating` に `context` 引数を追加する（既定 `'MANUAL'`）。

## 状態管理

- カードは**サーバーを単一の真実源**とする。Zustand に置く場合もキャッシュとして扱い、チェックイン後・解放後・`bingo:unlocked` 受信後に再取得する
- `useHomeBingoData` は新 API に置き換える。`getBingoCount` によるライン数の再計算は廃止し、`coins.earned` を使う
- 解放演出の再生済みフラグは `card_id` をキーに `sessionStorage`（[unlock-animation.md](../02-bingo-card/unlock-animation.md)）

## socket.io

既存の `src/shared/api/socket.ts` を使う。参加者は自動で `event:{event_id}:user:{user_id}` room に join される（サーバー側で対応）。

**接続は `useBingoUnlockedSocket` 自身が `connectSocket()` で確立する。**参加者側には他に socket を張る画面が無く（`connectSocket` の呼び出しは運営ダッシュボード系のみ）、`getSocket()` を読むだけでは常に `null` になり購読が張られないため。サンプルモードでは接続しない。

```ts
socket.on('bingo:unlocked', (data: { card_id: string; unlocked_at: string }) => { … })
```

**これは副経路である。**正の経路はチェックインレスポンスの `unlocked: true`。両方来ても演出は1回。

## ライン成立演出の受け渡し

チェックインレスポンスの `new_lines` / `coins_earned` はチェックイン画面で受け取り、ホーム画面の「🎉 BINGO!」モーダルへ `src/shared/lib/bingoCelebration.ts` 経由で引き渡す（サンプルモードも同じ経路を使う）。

`coins_earned` は**成立ライン総数を4でクリップした累計値であり、今回の獲得枚数ではない**。獲得枚数はチェックイン前のカードの `coins.earned` との差分で求める。差分が0でライン成立がある場合はコイン上限（4枚）到達の案内を出す。

## サンプルモード

`src/shared/data/sample/` のサンプルデータソースも段階解放に対応させる。**API を叩けない環境で画面確認をするために必要。**最低限、`CENTER_ONLY` と `UNLOCKED` の両状態を再現できること。
