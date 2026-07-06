export type WindowKey = 'booths' | 'participants' | 'checkins' | 'recommendations'

export type WindowDefinition = {
  key: WindowKey
  label: string
  icon: string
}

/** 分析ウィンドウ定義（追加時はここにエントリを足す） */
export const WINDOW_REGISTRY: WindowDefinition[] = [
  { key: 'booths', label: 'ブース分析', icon: 'bi-shop' },
  { key: 'participants', label: '参加者分析', icon: 'bi-people' },
  { key: 'checkins', label: 'チェックイン分析', icon: 'bi-qr-code-scan' },
  { key: 'recommendations', label: '推薦分析', icon: 'bi-lightning' },
]

export type FullPageNavItem = {
  to: string
  label: string
  icon: string
  /** true の項目は manager（旧 admin）のみ表示する */
  managerOnly?: boolean
}

/**
 * フルページナビ。
 * 「分析ボード」(/admin/menu = 分析ウィンドウ群) と「リアルタイム」(/admin/dashboard =
 * リアルタイム統計) を名前で区別する（E-4）。data 破壊系の「データ編集」は manager 限定。
 */
export const FULL_PAGE_NAV: FullPageNavItem[] = [
  { to: '/admin/menu', label: '分析ボード', icon: 'bi-grid-1x2' },
  { to: '/admin/dashboard', label: 'リアルタイム', icon: 'bi-speedometer2' },
  { to: '/admin/booths', label: 'ブース管理', icon: 'bi-shop' },
  { to: '/admin/categories', label: 'カテゴリ', icon: 'bi-tags' },
  { to: '/admin/survey', label: 'アンケート', icon: 'bi-clipboard-check' },
  { to: '/admin/participants', label: '参加者管理', icon: 'bi-person-lines-fill' },
  { to: '/admin/audit-logs', label: '操作履歴', icon: 'bi-clock-history' },
  { to: '/admin/sample', label: 'データ編集', icon: 'bi-database-gear', managerOnly: true },
]
