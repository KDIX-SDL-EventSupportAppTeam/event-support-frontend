// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GachaCoins } from '@/features/gachapon/api/gachaClient'

const getCoinsMock = vi.fn()
vi.mock('@/features/gachapon/api/gachaClient', () => ({
  createGachaClient: () => ({ getCoins: (...a: unknown[]) => getCoinsMock(...a) }),
}))

const { useGachaCoins } = await import('@/features/home/hooks/useGachaCoins')

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const coins = (lines: number, used: number): GachaCoins => ({
  is_enabled: true,
  lines_completed: lines,
  earned: lines,
  used,
  available: Math.max(0, lines - used),
  max_coins: 4,
})

let root: Root
let container: HTMLElement
let latest: GachaCoins | null = null

function Probe(props: { eventId?: string; userId?: string; lines?: number }) {
  latest = useGachaCoins(props.eventId, props.userId, props.lines)
  return null
}

async function render(props: { eventId?: string; userId?: string; lines?: number }) {
  await act(async () => {
    root.render(createElement(Probe, props))
  })
}

beforeEach(() => {
  getCoinsMock.mockReset()
  latest = null
  container = document.createElement('div')
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
})

describe('useGachaCoins', () => {
  it('初回表示でカードがまだ無くても1回取得する', async () => {
    getCoinsMock.mockResolvedValue(coins(0, 0))
    await render({ eventId: 'e1', userId: 'u1', lines: undefined })
    expect(getCoinsMock).toHaveBeenCalledTimes(1)
    expect(latest).toEqual(coins(0, 0))
  })

  it('lines_completed が同じなら、再レンダー（評価後のカード再取得など）で取り直さない', async () => {
    getCoinsMock.mockResolvedValue(coins(2, 0))
    await render({ eventId: 'e1', userId: 'u1', lines: 2 })
    await render({ eventId: 'e1', userId: 'u1', lines: 2 })
    await render({ eventId: 'e1', userId: 'u1', lines: 2 })
    expect(getCoinsMock).toHaveBeenCalledTimes(1)
  })

  it('lines_completed が増えたら取り直し、残り枚数の表示が更新される', async () => {
    getCoinsMock.mockResolvedValueOnce(coins(1, 0)).mockResolvedValueOnce(coins(2, 0))
    await render({ eventId: 'e1', userId: 'u1', lines: 1 })
    expect(latest?.available).toBe(1)
    await render({ eventId: 'e1', userId: 'u1', lines: 2 })
    expect(getCoinsMock).toHaveBeenCalledTimes(2)
    expect(latest?.available).toBe(2)
  })

  it('カード未取得（undefined）から取得済みに変わるときは取り直す（古い値を残さない）', async () => {
    getCoinsMock.mockResolvedValueOnce(coins(0, 0)).mockResolvedValueOnce(coins(2, 0))
    await render({ eventId: 'e1', userId: 'u1', lines: undefined })
    await render({ eventId: 'e1', userId: 'u1', lines: 2 })
    expect(getCoinsMock).toHaveBeenCalledTimes(2)
    expect(latest?.available).toBe(2)
  })

  it('再マウント（コイン使用後にホームへ戻る）では取り直し、減った残り枚数を表示する', async () => {
    getCoinsMock.mockResolvedValueOnce(coins(3, 0)).mockResolvedValueOnce(coins(3, 1))
    await render({ eventId: 'e1', userId: 'u1', lines: 3 })
    expect(latest?.available).toBe(3)
    await act(async () => root.unmount())
    root = createRoot(container)
    await render({ eventId: 'e1', userId: 'u1', lines: 3 })
    expect(getCoinsMock).toHaveBeenCalledTimes(2)
    expect(latest?.available).toBe(2)
  })

  it('eventId / userId が無いときは取得しない', async () => {
    await render({ eventId: undefined, userId: undefined, lines: 1 })
    expect(getCoinsMock).not.toHaveBeenCalled()
    expect(latest).toBeNull()
  })

  it('取得に失敗しても落ちず、null のまま（枚数なし表示）', async () => {
    getCoinsMock.mockRejectedValue(new Error('x'))
    await render({ eventId: 'e1', userId: 'u1', lines: 1 })
    expect(latest).toBeNull()
  })
})
