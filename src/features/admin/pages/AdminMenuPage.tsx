import { Link } from 'react-router-dom'
import { AdminShell } from '@/features/admin/components/AdminShell'

const MENU_CARDS = [
  {
    to: '/admin/dashboard',
    icon: 'bi-speedometer2',
    label: 'ダッシュボード',
    desc: 'リアルタイムのチェックイン状況・統計',
    color: '#0d6efd',
  },
  {
    to: '/admin/booths',
    icon: 'bi-shop',
    label: 'ブース管理',
    desc: 'ブースの追加・編集・削除',
    color: '#198754',
  },
  {
    to: '/admin/categories',
    icon: 'bi-tags',
    label: 'カテゴリ管理',
    desc: 'ブースのカテゴリを管理',
    color: '#fd7e14',
  },
  {
    to: '/admin/survey',
    icon: 'bi-clipboard-check',
    label: 'アンケート設問',
    desc: 'アンケートの設問を作成・編集',
    color: '#6f42c1',
  },
  {
    to: '/admin/participants',
    icon: 'bi-people',
    label: '参加者一覧',
    desc: '参加者のチェックイン状況を確認',
    color: '#0dcaf0',
  },
]

export function AdminMenuPage() {
  return (
    <AdminShell title="運営メニュー">
      <div className="row g-3">
        {MENU_CARDS.map((card) => (
          <div key={card.to} className="col-12 col-sm-6 col-lg-4">
            <Link to={card.to} className="text-decoration-none">
              <div
                className="card h-100 border-0 shadow-sm"
                style={{ transition: 'transform 0.15s', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div className="card-body d-flex align-items-start gap-3 p-4">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 52, height: 52, backgroundColor: card.color + '18' }}
                  >
                    <i className={`bi ${card.icon} fs-4`} style={{ color: card.color }} />
                  </div>
                  <div>
                    <div className="fw-semibold mb-1">{card.label}</div>
                    <div className="text-muted small">{card.desc}</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </AdminShell>
  )
}
