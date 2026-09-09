import { NavLink } from 'react-router-dom'
import '@/shared/components/layout/bottom-nav.scss'

interface NavItem {
  to: string
  label: string
  icon: string
  activeIcon?: string
  isFab?: boolean
  /**
   * 中央FABはラベル文字が円の中に焼き込まれているため、画面上のラベルは出さない。
   * 側の4項目は文字なしのグリフに揃えたので、ラベルは常に HTML 側で出す
   * （docs/reference/assets.md「ボトムナビのアイコンを揃える」）
   */
  showLabel?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/home',
    label: 'ホーム',
    icon: '/icon/nav/nav-home.png',
    activeIcon: '/icon/nav/nav-home-active.png',
    showLabel: true,
  },
  {
    to: '/booth-list',
    label: 'ブース一覧',
    // /icon/nav/nav-map.png は「会場マップ」という文言が焼き込まれており、
    // 07-venue-map.md で追加した /venue-map の導線と紛らわしいため使わない
    icon: '/icon/feature/feature-booth-list.png',
    showLabel: true,
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
    showLabel: true,
  },
  {
    to: '/award-vote',
    label: 'アワード投票',
    // /icon/nav/nav-fab-award.png は中央FAB用の素材で「アワード投票」が円の中に
    // 焼き込まれている。側の項目の寸法（1.9rem）まで縮めると文字が潰れて読めないため、
    // 文字なしの feature アイコンを使い、ラベルは HTML 側で出す
    icon: '/icon/feature/feature-award.png',
    showLabel: true,
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
                <>
                  <img src={isActive && item.activeIcon ? item.activeIcon : item.icon} alt="" />
                  {item.showLabel ? <span className="bottom-nav__label">{item.label}</span> : null}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
