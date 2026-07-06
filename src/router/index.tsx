import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLoginPage } from '@/features/admin/pages/AdminLoginPage'
import { AdminMenuPage } from '@/features/admin/pages/AdminMenuPage'
import { BoothManagePage } from '@/features/admin/pages/BoothManagePage'
import { CategoryManagePage } from '@/features/admin/pages/CategoryManagePage'
import { DashboardPage } from '@/features/admin/pages/DashboardPage'
import { AuditLogsPage } from '@/features/admin/pages/AuditLogsPage'
import { ParticipantsPage } from '@/features/admin/pages/ParticipantsPage'
import { SurveyManagePage } from '@/features/admin/pages/SurveyManagePage'
import { SampleDataPage } from '@/features/admin/pages/SampleDataPage'
import { LegacyPlaceholderPage } from '@/features/admin/pages/LegacyPlaceholderPage'
import { LoginPage } from '@/features/auth/pages/LoginPage/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage/RegisterPage'
import { JoinPage } from '@/features/auth/pages/JoinPage/JoinPage'
import { isAdminUser, useAuthStore } from '@/features/auth/store/authStore'
import { OrganizerLoginPage } from '@/features/organizer/pages/OrganizerLoginPage'
import { OrganizerEventCreatePage } from '@/features/organizer/pages/OrganizerEventCreatePage'
import { RequireOrganizer } from '@/features/organizer/guards/RequireOrganizer'
import { AwardVotePage } from '@/features/award/pages/AwardVotePage'
import { BoothListPage } from '@/features/booth/pages/BoothListPage/BoothListPage'
import { CheckInPage } from '@/features/checkin/pages/CheckInPage'
import { GachaponCompletePage } from '@/features/gachapon/pages/GachaponCompletePage'
import { GachaponIntroPage } from '@/features/gachapon/pages/GachaponIntroPage'
import { GachaponUsePage } from '@/features/gachapon/pages/GachaponUsePage'
import { HomePage } from '@/features/home/pages/HomePage/HomePage'
import { QaPage } from '@/features/qa/pages/QaPage'
import { SchedulePage } from '@/features/schedule/pages/SchedulePage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  if (!token) return <Navigate to="/admin/login" replace />
  if (!isAdminUser(user)) return <Navigate to="/home" replace />
  return children
}

/** 旧 Vue `router/index.js` と同一ルート（画面は段階的に React 化） */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/organizer/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/join/:eventId" element={<JoinPage />} />
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
      <Route path="/organizer/login" element={<OrganizerLoginPage />} />
      <Route
        path="/organizer/events/new"
        element={
          <RequireOrganizer>
            <OrganizerEventCreatePage />
          </RequireOrganizer>
        }
      />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/menu"
        element={
          <RequireAdmin>
            <AdminMenuPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <RequireAdmin>
            <DashboardPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/participants"
        element={
          <RequireAdmin>
            <ParticipantsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/booths"
        element={
          <RequireAdmin>
            <BoothManagePage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/survey"
        element={
          <RequireAdmin>
            <SurveyManagePage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <RequireAdmin>
            <CategoryManagePage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/sample"
        element={
          <RequireAdmin>
            <SampleDataPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <RequireAdmin>
            <AuditLogsPage />
          </RequireAdmin>
        }
      />
      <Route path="/admin/awards" element={<LegacyPlaceholderPage title="アワード一覧" />} />
      <Route path="/admin/awards/:awardName" element={<LegacyPlaceholderPage title="アワード詳細" />} />
      <Route path="/admin/top3" element={<LegacyPlaceholderPage title="TOP3" />} />
      {/* 設計ドキュメント用に追加していたパスは旧 URL にリダイレクト */}
      <Route path="/booths" element={<Navigate to="/booth-list" replace />} />
      <Route path="/booths/:id" element={<Navigate to="/booth-list" replace />} />
      <Route path="/survey" element={<Navigate to="/home" replace />} />
      <Route path="/scan" element={<Navigate to="/checkin" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
