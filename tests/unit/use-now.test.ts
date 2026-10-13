// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNow } from '@/features/gachapon/hooks/useNow'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
let latest: Date | null = null

function Probe() {
  latest = useNow(1000)
  return null
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-16T05:00:00.000Z'))
  root = createRoot(document.createElement('div'))
})

afterEach(async () => {
  await act(async () => root.unmount())
  vi.useRealTimers()
})

describe('useNow', () => {
  it('1 秒ごとに現在時刻が進む', async () => {
    await act(async () => root.render(createElement(Probe)))
    expect(latest?.toISOString()).toBe('2026-10-16T05:00:00.000Z')

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(latest?.toISOString()).toBe('2026-10-16T05:00:01.000Z')

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(latest?.toISOString()).toBe('2026-10-16T05:00:03.000Z')
  })

  it('アンマウント後はタイマーが残らない', async () => {
    await act(async () => root.render(createElement(Probe)))
    await act(async () => root.unmount())
    expect(vi.getTimerCount()).toBe(0)
    root = createRoot(document.createElement('div'))
  })
})
