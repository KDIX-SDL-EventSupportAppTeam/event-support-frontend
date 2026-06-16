import { Link } from 'react-router-dom'
import { AdminShell } from '@/features/admin/components/AdminShell'

const links = [
  { to: '/admin/dashboard', label: 'ダッシュボード' },
  { to: '/admin/booths', label: 'ブース管理' },
  { to: '/admin/categories', label: 'カテゴリ管理' },
  { to: '/admin/survey', label: 'アンケート設問' },
  { to: '/admin/participants', label: '参加者一覧' },
]

export function AdminMenuPage() {
  return (
    <AdminShell title="運営メニュー">
      <div className="list-group">
        {links.map((item) => (
          <Link key={item.to} to={item.to} className="list-group-item list-group-item-action">
            {item.label}
          </Link>
        ))}
      </div>
    </AdminShell>
  )
}
