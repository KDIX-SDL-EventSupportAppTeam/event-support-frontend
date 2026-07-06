/** 設計ドキュメントの認証レスポンス `user` に合わせる */
export type AuthUser = {
  id: string
  display_name: string
  event_id: string
  /**
   * role の値:
   *   - 'manager'  : 運営（編集権限あり）
   *   - 'viewer'   : 閲覧スタッフ（読み取り専用）
   *   - 'participant' : 参加者
   *   - 'admin'    : 旧値。後方互換のため 'manager' として扱う
   */
  role: 'manager' | 'viewer' | 'participant' | 'admin'
}
