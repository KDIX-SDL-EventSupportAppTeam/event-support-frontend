import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AdminLoginPage } from '@/features/admin/pages/AdminLoginPage'
import { AdminMenuPage } from '@/features/admin/pages/AdminMenuPage'
import { BoothManagePage } from '@/features/admin/pages/BoothManagePage'
import { CategoryManagePage } from '@/features/admin/pages/CategoryManagePage'
import { DashboardPage } from '@/features/admin/pages/DashboardPage'
import { ParticipantsPage } from '@/features/admin/pages/ParticipantsPage'
import { SurveyManagePage } from '@/features/admin/pages/SurveyManagePage'
import { SampleDataPage } from '@/features/admin/pages/SampleDataPage'
import { AuditLogPage } from '@/features/admin/pages/AuditLogPage'
import { BoothCommentsPage } from '@/features/admin/pages/BoothCommentsPage'
import { ExhibitorBulkRegisterPage } from '@/features/admin/pages/ExhibitorBulkRegisterPage'
import { LegacyPlaceholderPage } from '@/features/admin/pages/LegacyPlaceholderPage'
import { GachaponIntroPage } from '@/features/gachapon/pages/GachaponIntroPage'
import { GachaponUsePage } from '@/features/gachapon/pages/GachaponUsePage'
import { GachaponCompletePage } from '@/features/gachapon/pages/GachaponCompletePage'
import { VerifyEmailPage } from '@/features/auth/pages/VerifyEmailPage/VerifyEmailPage'
import { isAdminUser, useAuthStore } from '@/shared/auth/authStore'
import { RequireAppOpen } from '@/shared/access/RequireAppOpen'
import { entryPathForRedirect } from '@/shared/lib/lastEventId'
import { ParticipantLayout } from '@/shared/components/layout/ParticipantLayout'
import { OrganizerLoginPage } from '@/features/organizer/pages/OrganizerLoginPage'
import { OrganizerEventCreatePage } from '@/features/organizer/pages/OrganizerEventCreatePage'
import { OrganizerEventListPage } from '@/features/organizer/pages/OrganizerEventListPage'
import { OrganizerEventDetailPage } from '@/features/organizer/pages/OrganizerEventDetailPage'
import { RequireOrganizer } from '@/features/organizer/guards/RequireOrganizer'
import { BoothListPage } from '@/features/booth/pages/BoothListPage/BoothListPage'
import { CheckInPage } from '@/features/checkin/pages/CheckInPage'
import { ExhibitorDashboardPage } from '@/features/exhibitor/pages/ExhibitorDashboardPage'
import { HomePage } from '@/features/home/pages/HomePage/HomePage'
import { EntryPage } from '@/features/entry/pages/EntryPage'
import { QaPage } from '@/features/qa/pages/QaPage'
import { SchedulePage } from '@/features/schedule/pages/SchedulePage'
import { VenueMapPage } from '@/features/venue-map/pages/VenueMapPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  // 参加者向けのログイン画面は独立して存在しないため、配布リンクへ戻す（R3）。
  // どのイベントか分からなければ案内ページ（/e）が受け止める。
  if (!token) return <Navigate to={entryPathForRedirect()} replace />
  return children
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  if (!token) return <Navigate to="/admin/login" replace />
  if (!isAdminUser(user)) return <Navigate to="/home" replace />
  return children
}

/** URL 内の `:eventId` を保ったまま新しい入口へ送る（旧 URL の受け皿）。 */
function LegacyEntryRedirect() {
  const { eventId } = useParams<{ eventId: string }>()
  return <Navigate to={eventId ? `/e/${eventId}` : entryPathForRedirect()} replace />
}

/** 参加者は `/e/:eventId` 1 本、運営・管理は従来どおり別系統。 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/organizer/login" replace />} />
      {/* 参加者が触る唯一の URL。段階は持たず、GET /me/state の戻り値で表示が変わる */}
      <Route path="/e" element={<EntryPage />} />
      <Route path="/e/:eventId" element={<EntryPage />} />
      {/* 統合前に配布・ブックマークされた URL の受け皿 */}
      <Route path="/login" element={<Navigate to={entryPathForRedirect()} replace />} />
      <Route path="/register" element={<Navigate to={entryPathForRedirect()} replace />} />
      <Route path="/join/:eventId" element={<LegacyEntryRedirect />} />
      <Route path="/pre-survey/:eventId" element={<LegacyEntryRedirect />} />
      <Route path="/pre-survey/:eventId/*" element={<LegacyEntryRedirect />} />
      <Route path="/pre-register" element={<LegacyPlaceholderPage title="プレ登録" />} />
      <Route path="/forgot-password" element={<LegacyPlaceholderPage title="パスワードを忘れた場合" />} />
      <Route path="/reset-password/:token" element={<LegacyPlaceholderPage title="パスワード再設定" />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route
        path="/exhibitor"
        element={
          <RequireAuth>
            <ExhibitorDashboardPage />
          </RequireAuth>
        }
      />
      <Route element={<ParticipantLayout />}>
        {/*
          参加者が触る画面はすべてこのゲート配下に置く（docs/specs/app-access-gate-scope）。
          1画面ずつ RequireAuth / RequireAppOpen を書き足さない。ここに Route を足せば
          自動で「認証必須 + アプリ公開ゲート」が掛かる構造にしておく。
          入口（/e, /e/:eventId）とメール確認（/verify-email）はこの外に置くこと。
        */}
        <Route
          element={
            <RequireAuth>
              <RequireAppOpen />
            </RequireAuth>
          }
        >
          <Route path="/home" element={<HomePage />} />
          <Route path="/checkin" element={<CheckInPage />} />
          <Route
            path="/award-vote"
            element={<LegacyPlaceholderPage title="アワード投票（準備中）" />}
          />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/booth-list" element={<BoothListPage />} />
          <Route path="/venue-map" element={<VenueMapPage />} />
          <Route path="/gachapon" element={<GachaponIntroPage />} />
          <Route path="/gachapon/use" element={<GachaponUsePage />} />
          <Route path="/gachapon/complete" element={<GachaponCompletePage />} />
          <Route path="/qa" element={<QaPage />} />
        </Route>
      </Route>
      <Route path="/organizer/login" element={<OrganizerLoginPage />} />
      <Route
        path="/organizer/events"
        element={
          <RequireOrganizer>
            <OrganizerEventListPage />
          </RequireOrganizer>
        }
      />
      <Route
        path="/organizer/events/new"
        element={
          <RequireOrganizer>
            <OrganizerEventCreatePage />
          </RequireOrganizer>
        }
      />
      <Route
        path="/organizer/events/:eventId"
        element={
          <RequireOrganizer>
            <OrganizerEventDetailPage />
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
            <AuditLogPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/comments"
        element={
          <RequireAdmin>
            <BoothCommentsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/exhibitors"
        element={
          <RequireAdmin>
            <ExhibitorBulkRegisterPage />
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
      <Route path="/onboarding" element={<Navigate to={entryPathForRedirect()} replace />} />
      <Route path="/scan" element={<Navigate to="/checkin" replace />} />
      {/* 未定義 URL は参加者を運営ログインに落とさず、配布リンク（無ければ案内）へ送る */}
      <Route path="*" element={<Navigate to={entryPathForRedirect()} replace />} />
    </Routes>
  )
}
