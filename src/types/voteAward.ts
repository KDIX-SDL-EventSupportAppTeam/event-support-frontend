/** アワード投票画面（旧 Vue）のカテゴリ行 */
export type VoteAwardCategory = {
  name: string
  description: string
  /** 下線・矢印・枠線の色クラス接尾辞（pink, purple 等） */
  color: string
}

export type CheckInResult = {
  checkin_id: string
  checkedInBooth: { id: string; name: string; emoji: string }
}
