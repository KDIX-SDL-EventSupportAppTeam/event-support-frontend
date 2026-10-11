// @vitest-environment jsdom
import { createElement, act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UnlockAnimation } from '@/features/home/components/bingo/UnlockAnimation'
import {
  UNLOCK_MODAL_AUTO_CLOSE_MS,
  UNLOCK_MODAL_BUTTON_ENABLE_MS,
} from '@/features/home/components/bingo/unlockModalCopy'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.useFakeTimers()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

const button = () => container.querySelector('button') as HTMLButtonElement

/** CheckInPage と同じ状況: 毎秒再レンダーされ、そのたびに onDone が新しい関数になる親。 */
function TickingParent({ onClose, positions }: { onClose: () => void; positions: number[] }) {
  const [, setTick] = useState(0)
  ;(globalThis as { __tick?: () => void }).__tick = () => setTick((n) => n + 1)
  return createElement(UnlockAnimation, { positions, onDone: () => onClose() })
}

function tickEverySecond(ms: number) {
  for (let t = 0; t < ms; t += 1000) {
    act(() => vi.advanceTimersByTime(Math.min(1000, ms - t)))
    act(() => (globalThis as { __tick?: () => void }).__tick?.())
  }
}

describe('UnlockAnimation のタイマー（親が毎秒再レンダーされても）', () => {
  it('300ms で「閉じる」が有効になる。それまでは無効', () => {
    const onClose = vi.fn()
    act(() => root.render(createElement(TickingParent, { onClose, positions: [1, 2] })))
    expect(button().disabled).toBe(true)
    act(() => vi.advanceTimersByTime(UNLOCK_MODAL_BUTTON_ENABLE_MS - 1))
    expect(button().disabled).toBe(true)
    act(() => vi.advanceTimersByTime(1))
    expect(button().disabled).toBe(false)
  })

  it('再レンダーで 300ms のタイマーがリセットされない（毎秒再レンダー後も有効なまま）', () => {
    const onClose = vi.fn()
    act(() => root.render(createElement(TickingParent, { onClose, positions: [1, 2] })))
    act(() => vi.advanceTimersByTime(250))
    act(() => (globalThis as { __tick?: () => void }).__tick?.())
    act(() => vi.advanceTimersByTime(50))
    expect(button().disabled).toBe(false)
  })

  it('3000ms で onDone が 1 回だけ呼ばれる。起きてはいけないこと: 再レンダーで呼ばれない／二重に呼ばれる', () => {
    const onClose = vi.fn()
    act(() => root.render(createElement(TickingParent, { onClose, positions: [1, 2] })))
    tickEverySecond(UNLOCK_MODAL_AUTO_CLOSE_MS - 1)
    expect(onClose).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onClose).toHaveBeenCalledTimes(1)
    tickEverySecond(5000)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('key を変えると新しいタイマーが走る（キューの次の解放も 300ms / 3000ms で効く）', () => {
    const onClose = vi.fn()
    const render = (pairKey: string) =>
      act(() =>
        root.render(
          createElement(UnlockAnimation, { key: pairKey, positions: [1, 2], onDone: () => onClose(pairKey) }),
        ),
      )
    render('a')
    act(() => vi.advanceTimersByTime(UNLOCK_MODAL_AUTO_CLOSE_MS))
    expect(onClose).toHaveBeenLastCalledWith('a')
    render('b')
    expect(button().disabled).toBe(true)
    act(() => vi.advanceTimersByTime(UNLOCK_MODAL_BUTTON_ENABLE_MS))
    expect(button().disabled).toBe(false)
    act(() => vi.advanceTimersByTime(UNLOCK_MODAL_AUTO_CLOSE_MS - UNLOCK_MODAL_BUTTON_ENABLE_MS))
    expect(onClose).toHaveBeenLastCalledWith('b')
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('最新の onDone が呼ばれる（古い関数を握らない）', () => {
    const first = vi.fn()
    const second = vi.fn()
    act(() => root.render(createElement(UnlockAnimation, { positions: [1], onDone: first })))
    act(() => root.render(createElement(UnlockAnimation, { positions: [1], onDone: second })))
    act(() => vi.advanceTimersByTime(UNLOCK_MODAL_AUTO_CLOSE_MS))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
