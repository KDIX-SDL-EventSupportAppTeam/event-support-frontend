import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { BoothListPage } from '@/pages/BoothListPage/BoothListPage'
import { AwardVotePage } from '@/pages/award/AwardVotePage'
import { CheckInPage } from '@/pages/checkin/CheckInPage'
import { GachaponCompletePage } from '@/pages/gachapon/GachaponCompletePage'
import { GachaponIntroPage } from '@/pages/gachapon/GachaponIntroPage'
import { GachaponUsePage } from '@/pages/gachapon/GachaponUsePage'
import { QaPage } from '@/pages/qa/QaPage'
import { SchedulePage } from '@/pages/schedule/SchedulePage'
import { HomePage } from '@/pages/HomePage/HomePage'
import { LandingPage } from '@/pages/LandingPage/LandingPage'
import { LegacyPlaceholderPage } from '@/pages/LegacyPlaceholderPage'
import { LoginPage } from '@/pages/LoginPage/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage/RegisterPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

/** 旧 Vue `router/index.js` と同一ルート（画面は段階的に React 化） */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pre-register" element={<LegacyPlaceholderPage title="プレ登録" />} />
      <Route path="/forgot-password" element={<LegacyPlaceholderPage title="パスワードを忘れた場合" />} />
      <Route path="/reset-password/:token" element={<LegacyPlaceholderPage title="パスワード再設定" />} />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        }
      />
      <Route
        path="/checkin"
        element={
          <RequireAuth>
            <CheckInPage />
          </RequireAuth>
        }
      />
      <Route
        path="/award-vote"
        element={
          <RequireAuth>
            <AwardVotePage />
          </RequireAuth>
        }
      />
      <Route
        path="/schedule"
        element={
          <RequireAuth>
            <SchedulePage />
          </RequireAuth>
        }
      />
      <Route
        path="/booth-list"
        element={
          <RequireAuth>
            <BoothListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/gachapon"
        element={
          <RequireAuth>
            <GachaponIntroPage />
          </RequireAuth>
        }
      />
      <Route
        path="/gachapon/use"
        element={
          <RequireAuth>
            <GachaponUsePage />
          </RequireAuth>
        }
      />
      <Route
        path="/gachapon/complete"
        element={
          <RequireAuth>
            <GachaponCompletePage />
          </RequireAuth>
        }
      />
      <Route path="/qa" element={<QaPage />} />
      <Route path="/admin/login" element={<LegacyPlaceholderPage title="運営ログイン" />} />
      <Route path="/admin/menu" element={<LegacyPlaceholderPage title="運営メニュー" />} />
      <Route path="/admin/awards" element={<LegacyPlaceholderPage title="アワード一覧" />} />
      <Route path="/admin/awards/:awardName" element={<LegacyPlaceholderPage title="アワード詳細" />} />
      <Route path="/admin/top3" element={<LegacyPlaceholderPage title="TOP3" />} />
      {/* 設計ドキュメント用に追加していたパスは旧 URL にリダイレクト */}
      <Route path="/booths" element={<Navigate to="/booth-list" replace />} />
      <Route path="/booths/:id" element={<Navigate to="/booth-list" replace />} />
      <Route path="/survey" element={<Navigate to="/home" replace />} />
      <Route path="/scan" element={<Navigate to="/checkin" replace />} />
      <Route path="/admin/dashboard" element={<Navigate to="/admin/menu" replace />} />
      <Route path="/admin/participants" element={<Navigate to="/admin/menu" replace />} />
      <Route path="/admin/booths" element={<Navigate to="/admin/menu" replace />} />
      <Route path="/admin/survey" element={<Navigate to="/admin/menu" replace />} />
      <Route path="/admin/categories" element={<Navigate to="/admin/menu" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
