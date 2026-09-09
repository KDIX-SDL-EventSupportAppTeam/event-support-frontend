/**
 * 賞（アワード投票）。issue #89 で型を1本に統合した。
 * 旧 `VoteAwardCategory`（`shared/types/voteAward.ts`）は廃止。
 *
 * 投票は **`award_id` をキー**にする（賞名を直すと票が迷子になるため）。
 * API 契約の正本: event-support-server `docs/specs/gacha-and-award/06-api/award-api.md`
 */
export type Award = {
  id: string
  name: string
  description: string
  /** 下線・矢印・枠線の色クラス接尾辞（pink, purple 等） */
  color: string
  /** 表示順（サーバーが付与。運営画面の並べ替え用） */
  sort_order?: number
}
