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
  /** true の項目はナビ末尾の「開発者向け」欄に赤字で分けて出す */
  devOnly?: boolean
}

/**
 * フルページナビ。
 * 「分析ボード」(/admin/menu = 分析ウィンドウ群) と「リアルタイム」(/admin/dashboard =
 * リアルタイム統計) を名前で区別する（E-4）。
 * 一括登録・初期設定・データ編集など本番データを大きく書き換える画面は、
 * 「開発者ツール」1項目にまとめて manager 限定にする（中身は /admin/dev-tools のハブから辿る）。
 */
export const FULL_PAGE_NAV: FullPageNavItem[] = [
  { to: '/admin/menu', label: '分析ボード', icon: 'bi-grid-1x2' },
  { to: '/admin/dashboard', label: 'リアルタイム', icon: 'bi-speedometer2' },
  { to: '/admin/booths', label: 'ブース管理', icon: 'bi-shop' },
  { to: '/admin/comments', label: '評価・コメント', icon: 'bi-chat-left-text' },
  { to: '/admin/categories', label: 'カテゴリ', icon: 'bi-tags' },
  { to: '/admin/survey', label: 'アンケート', icon: 'bi-clipboard-check' },
  { to: '/admin/awards', label: 'アワード', icon: 'bi-award' },
  { to: '/admin/awards/results', label: 'アワード結果', icon: 'bi-trophy' },
  { to: '/admin/participants', label: '参加者管理', icon: 'bi-person-lines-fill' },
  { to: '/admin/exhibitors', label: '出展者一覧', icon: 'bi-person-badge' },
  { to: '/admin/audit-logs', label: '操作履歴', icon: 'bi-clock-history' },
  { to: '/admin/dev-tools', label: '開発者ツール', icon: 'bi-exclamation-octagon', managerOnly: true, devOnly: true },
]

/**
 * 開発者ツールのハブ（/admin/dev-tools）に並べる画面。
 * いずれも本番データを一括で作成・上書き・削除するため、サイドバーには直接出さない。
 */
export const DEV_TOOL_PAGES: { to: string; label: string; icon: string; description: string }[] = [
  {
    to: '/admin/protofes-setup',
    label: 'プロトフェス用初期設定',
    icon: 'bi-stars',
    description: 'プロトフェスのブース・カテゴリを既定値で一括作成・更新します。',
  },
  {
    to: '/admin/dev-tools/master-data',
    label: 'カテゴリ・アワード一括登録',
    icon: 'bi-tags',
    description: '推薦に使うカテゴリと、本番で実施するアワードをまとめて登録します。',
  },
  {
    to: '/admin/booths/bulk',
    label: 'ブース一括登録',
    icon: 'bi-table',
    description: '表に入力したブースを一括で作成します。',
  },
  {
    to: '/admin/exhibitors/bulk',
    label: '出展者一括登録',
    icon: 'bi-person-badge',
    description: '出展者アカウントを一括で作成し、ブースに紐付けます。',
  },
  {
    to: '/admin/sample',
    label: 'データ編集（サンプル生成・全削除）',
    icon: 'bi-database-gear',
    description: 'サンプルデータの生成と、イベントデータの削除を行います。',
  },
]
