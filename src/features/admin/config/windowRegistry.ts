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

export const FULL_PAGE_NAV = [
  { to: '/admin/dashboard', label: 'ダッシュボード', icon: 'bi-speedometer2' },
  { to: '/admin/booths', label: 'ブース管理', icon: 'bi-shop' },
  { to: '/admin/categories', label: 'カテゴリ', icon: 'bi-tags' },
  { to: '/admin/survey', label: 'アンケート', icon: 'bi-clipboard-check' },
  { to: '/admin/participants', label: '参加者管理', icon: 'bi-person-lines-fill' },
] as const
