import { Outlet } from 'react-router-dom'
import { BottomNav } from '@/shared/components/layout/BottomNav'
import '@/shared/components/layout/bottom-nav.scss'

/** 参加者向け画面の外枠。ページ本体 + ボトムナビを描画する（ヘッダーは無い） */
export function ParticipantLayout() {
  return (
    <div className="participant-layout">
      <main className="participant-layout__body">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
