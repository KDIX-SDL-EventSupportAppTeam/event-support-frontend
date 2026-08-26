import { NavLink } from 'react-router-dom'
import '@/shared/components/layout/bottom-nav.scss'

interface NavItem {
  to: string
  label: string
  icon: string
  activeIcon?: string
  isFab?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/home',
    label: 'ホーム',
    icon: '/icon/nav/nav-home.png',
    activeIcon: '/icon/nav/nav-home-active.png',
  },
  {
    to: '/booth-list',
    label: 'ブース一覧',
    icon: '/icon/nav/nav-map.png',
  },
  {
    to: '/checkin',
    label: 'チェックイン',
    icon: '/icon/nav/nav-fab-checkin.png',
    isFab: true,
  },
  {
    to: '/schedule',
    label: 'スケジュール',
    icon: '/icon/nav/nav-schedule.png',
  },
  {
    to: '/award-vote',
    label: 'アワード投票',
    icon: '/icon/nav/nav-fab-award.png',
  },
]

/** 参加者画面のボトムナビ。選択状態は NavLink が持つ現在パスの一致で決める（自前 state を持たない） */
export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="メインナビゲーション">
      <img src="/ui/nav/nav-bar-notched.png" alt="" className="bottom-nav__bar" aria-hidden="true" />
      <ul className="bottom-nav__list">
        {NAV_ITEMS.map((item) => (
          <li key={item.to} className={`bottom-nav__item${item.isFab ? ' bottom-nav__item--fab' : ''}`}>
            <NavLink
              to={item.to}
              className={({ isActive }) => `bottom-nav__link${isActive ? ' bottom-nav__link--active' : ''}`}
              aria-label={item.label}
            >
              {({ isActive }) => (
                <img src={isActive && item.activeIcon ? item.activeIcon : item.icon} alt={item.label} />
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
