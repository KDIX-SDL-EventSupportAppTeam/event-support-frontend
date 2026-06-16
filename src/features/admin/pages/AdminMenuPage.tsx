import { AdminShell } from '@/features/admin/components/AdminShell'
import { EventInfoPanel } from '@/features/admin/components/EventInfoPanel'
import { WINDOW_REGISTRY, type WindowKey } from '@/features/admin/config/windowRegistry'
import { useAdminMenuStore } from '@/features/admin/store/adminMenuStore'
import { BoothAnalyticsWindow } from '@/features/admin/windows/BoothAnalyticsWindow'
import { CheckinAnalyticsWindow } from '@/features/admin/windows/CheckinAnalyticsWindow'
import { ParticipantAnalyticsWindow } from '@/features/admin/windows/ParticipantAnalyticsWindow'
import { RecommendationAnalyticsWindow } from '@/features/admin/windows/RecommendationAnalyticsWindow'
import { useAuthStore } from '@/features/auth/store/authStore'

const WINDOW_COMPONENTS: Record<
  WindowKey,
  React.ComponentType<{ eventId: string; minimized: boolean; onToggleMinimize: () => void }>
> = {
  booths: BoothAnalyticsWindow,
  participants: ParticipantAnalyticsWindow,
  checkins: CheckinAnalyticsWindow,
  recommendations: RecommendationAnalyticsWindow,
}

export function AdminMenuPage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const visibleWindows = useAdminMenuStore((s) => s.visibleWindows)
  const minimizedWindows = useAdminMenuStore((s) => s.minimizedWindows)
  const toggleMinimized = useAdminMenuStore((s) => s.toggleMinimized)

  if (!eventId) {
    return (
      <AdminShell>
        <p className="text-danger">イベント ID が取得できません</p>
      </AdminShell>
    )
  }

  const activeWindows = WINDOW_REGISTRY.filter((w) => visibleWindows.includes(w.key))

  return (
    <AdminShell>
      <div className="d-flex flex-column gap-3">
        <EventInfoPanel eventId={eventId} />

        {activeWindows.length === 0 ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center text-muted py-5">
              左サイドバーの「ウィンドウ」から分析パネルを ON にしてください
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '1rem',
            }}
          >
            {activeWindows.map((def) => {
              const Component = WINDOW_COMPONENTS[def.key]
              return (
                <Component
                  key={def.key}
                  eventId={eventId}
                  minimized={minimizedWindows.includes(def.key)}
                  onToggleMinimize={() => toggleMinimized(def.key)}
                />
              )
            })}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
