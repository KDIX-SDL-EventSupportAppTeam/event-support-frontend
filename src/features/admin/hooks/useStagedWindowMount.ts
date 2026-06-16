import { useEffect, useState } from 'react'
import type { WindowKey } from '@/features/admin/config/windowRegistry'

/** 分析ウィンドウを idle 時に順次マウントし、初期レンダリング負荷を分散する */
export function useStagedWindowMount(keys: WindowKey[]): Set<WindowKey> {
  const [ready, setReady] = useState<WindowKey[]>([])

  useEffect(() => {
    setReady([])
    if (keys.length === 0) return

    let cancelled = false
    let index = 0

    const mountNext = () => {
      if (cancelled || index >= keys.length) return
      const key = keys[index]
      index += 1
      setReady((prev) => (prev.includes(key) ? prev : [...prev, key]))
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(mountNext, { timeout: 400 })
      } else {
        setTimeout(mountNext, 120)
      }
    }

    mountNext()
    return () => {
      cancelled = true
    }
  }, [keys.join('|')])

  return new Set(ready)
}
