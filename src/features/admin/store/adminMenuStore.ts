import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WindowKey } from '@/features/admin/config/windowRegistry'
import { WINDOW_REGISTRY } from '@/features/admin/config/windowRegistry'
import { fetchAdminEvent, type AdminEvent } from '@/shared/api/v1Admin'

const DEFAULT_VISIBLE: WindowKey[] = WINDOW_REGISTRY.map((w) => w.key)

type AdminMenuState = {
  visibleWindows: WindowKey[]
  minimizedWindows: WindowKey[]
  /**
   * サイドバー・EventInfoPanel が共用するイベント情報キャッシュ（FE-R2）。
   * 開催ステータスは保存せず、キャッシュした日時から表示時に導出する。
   * セッションをまたいで古い情報を出さないよう persist 対象外（partialize 参照）。
   */
  cachedEvent: AdminEvent | null
  toggleWindow: (key: WindowKey) => void
  toggleMinimized: (key: WindowKey) => void
  setCachedEvent: (event: AdminEvent) => void
}

export const useAdminMenuStore = create<AdminMenuState>()(
  persist(
    (set, get) => ({
      visibleWindows: DEFAULT_VISIBLE,
      minimizedWindows: [],
      cachedEvent: null,
      toggleWindow: (key) => {
        const { visibleWindows } = get()
        set({
          visibleWindows: visibleWindows.includes(key)
            ? visibleWindows.filter((k) => k !== key)
            : [...visibleWindows, key],
        })
      },
      toggleMinimized: (key) => {
        const { minimizedWindows } = get()
        set({
          minimizedWindows: minimizedWindows.includes(key)
            ? minimizedWindows.filter((k) => k !== key)
            : [...minimizedWindows, key],
        })
      },
      setCachedEvent: (event) => set({ cachedEvent: event }),
    }),
    {
      name: 'admin-menu-store',
      // ウィンドウ配置のみ永続化する（イベント情報はセッション内キャッシュ）
      partialize: (s) => ({
        visibleWindows: s.visibleWindows,
        minimizedWindows: s.minimizedWindows,
      }),
    },
  ),
)

let inflightEventFetch: { eventId: string; promise: Promise<AdminEvent> } | null = null

/**
 * イベント情報を取得して adminMenuStore にキャッシュする（FE-R2）。
 * 同一 eventId の間はキャッシュを返して再フェッチせず、
 * 同時マウント（AdminShell + EventInfoPanel）でも in-flight の Promise を共有して
 * GET /admin/events/:id を 1 回に抑える。
 */
export function fetchAdminEventCached(eventId: string): Promise<AdminEvent> {
  const cached = useAdminMenuStore.getState().cachedEvent
  if (cached?.id === eventId) return Promise.resolve(cached)
  if (inflightEventFetch?.eventId === eventId) return inflightEventFetch.promise

  const promise = fetchAdminEvent(eventId)
    .then((e) => {
      useAdminMenuStore.getState().setCachedEvent(e)
      return e
    })
    .finally(() => {
      if (inflightEventFetch?.eventId === eventId) inflightEventFetch = null
    })
  inflightEventFetch = { eventId, promise }
  return promise
}
