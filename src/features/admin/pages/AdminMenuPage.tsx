import { lazy, Suspense, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { AnalyticsWindow } from '@/features/admin/components/AnalyticsWindow'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { EventInfoPanel } from '@/features/admin/components/EventInfoPanel'
import { WINDOW_REGISTRY, type WindowKey } from '@/features/admin/config/windowRegistry'
import { useStagedWindowMount } from '@/features/admin/hooks/useStagedWindowMount'
import { useAdminMenuStore } from '@/features/admin/store/adminMenuStore'
import { useAuthStore } from '@/shared/auth/authStore'

const LazyBoothAnalyticsWindow = lazy(() =>
  import('@/features/admin/windows/BoothAnalyticsWindow').then((m) => ({
    default: m.BoothAnalyticsWindow,
  })),
)
const LazyParticipantAnalyticsWindow = lazy(() =>
  import('@/features/admin/windows/ParticipantAnalyticsWindow').then((m) => ({
    default: m.ParticipantAnalyticsWindow,
  })),
)
const LazyCheckinAnalyticsWindow = lazy(() =>
  import('@/features/admin/windows/CheckinAnalyticsWindow').then((m) => ({
    default: m.CheckinAnalyticsWindow,
  })),
)
const LazyRecommendationAnalyticsWindow = lazy(() =>
  import('@/features/admin/windows/RecommendationAnalyticsWindow').then((m) => ({
    default: m.RecommendationAnalyticsWindow,
  })),
)

const LAZY_WINDOWS: Record<
  WindowKey,
  React.LazyExoticComponent<
    React.ComponentType<{ eventId: string; active: boolean; minimized: boolean; onToggleMinimize: () => void }>
  >
> = {
  booths: LazyBoothAnalyticsWindow,
  participants: LazyParticipantAnalyticsWindow,
  checkins: LazyCheckinAnalyticsWindow,
  recommendations: LazyRecommendationAnalyticsWindow,
}

function WindowPlaceholder({ label, icon }: { label: string; icon: string }) {
  return (
    <AnalyticsWindow title={label} icon={icon} minimized={false} onToggleMinimize={() => undefined}>
      <div className="text-muted small py-2">準備中…</div>
    </AnalyticsWindow>
  )
}

export function AdminMenuPage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const { visibleWindows, minimizedWindows, toggleMinimized } = useAdminMenuStore(
    useShallow((s) => ({
      visibleWindows: s.visibleWindows,
      minimizedWindows: s.minimizedWindows,
      toggleMinimized: s.toggleMinimized,
    })),
  )

  const activeWindows = useMemo(
    () => WINDOW_REGISTRY.filter((w) => visibleWindows.includes(w.key)),
    [visibleWindows],
  )
  const stagedKeys = useStagedWindowMount(activeWindows.map((w) => w.key))

  const toggleHandlers = useMemo(() => {
    const handlers = {} as Record<WindowKey, () => void>
    for (const w of WINDOW_REGISTRY) {
      handlers[w.key] = () => toggleMinimized(w.key)
    }
    return handlers
  }, [toggleMinimized])

  if (!eventId) {
    return (
      <AdminShell>
        <p className="text-danger">イベント ID が取得できません</p>
      </AdminShell>
    )
  }

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
              const minimized = minimizedWindows.includes(def.key)
              const mounted = stagedKeys.has(def.key)
              const active = mounted && !minimized
              const LazyWindow = LAZY_WINDOWS[def.key]

              if (!mounted) {
                return <WindowPlaceholder key={def.key} label={def.label} icon={def.icon} />
              }

              return (
                <Suspense
                  key={def.key}
                  fallback={<WindowPlaceholder label={def.label} icon={def.icon} />}
                >
                  <LazyWindow
                    eventId={eventId}
                    active={active}
                    minimized={minimized}
                    onToggleMinimize={toggleHandlers[def.key]}
                  />
                </Suspense>
              )
            })}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
