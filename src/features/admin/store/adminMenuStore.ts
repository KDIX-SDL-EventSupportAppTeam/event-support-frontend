import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WindowKey } from '@/features/admin/config/windowRegistry'
import { WINDOW_REGISTRY } from '@/features/admin/config/windowRegistry'

const DEFAULT_VISIBLE: WindowKey[] = WINDOW_REGISTRY.map((w) => w.key)

type AdminMenuState = {
  visibleWindows: WindowKey[]
  minimizedWindows: WindowKey[]
  toggleWindow: (key: WindowKey) => void
  toggleMinimized: (key: WindowKey) => void
}

export const useAdminMenuStore = create<AdminMenuState>()(
  persist(
    (set, get) => ({
      visibleWindows: DEFAULT_VISIBLE,
      minimizedWindows: [],
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
    }),
    { name: 'admin-menu-store' },
  ),
)
