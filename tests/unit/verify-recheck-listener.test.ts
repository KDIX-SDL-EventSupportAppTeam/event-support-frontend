import { describe, expect, it } from 'vitest'
import {
  attachRecheckListeners,
  type ListenerTarget,
  type VisibilityDocument,
} from '@/features/entry/lib/verifyRecheckListener'

/** addEventListener/removeEventListener を持つ最小のフェイク EventTarget */
function makeFakeTarget(): ListenerTarget & { dispatch: (type: string) => void } {
  const listeners = new Map<string, Set<() => void>>()
  return {
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type)!.add(listener)
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener)
    },
    dispatch(type) {
      for (const listener of listeners.get(type) ?? []) listener()
    },
  }
}

function makeFakeDocument(
  initialVisibility: 'visible' | 'hidden',
): VisibilityDocument & { dispatch: (type: string) => void; visibilityState: 'visible' | 'hidden' } {
  const target = makeFakeTarget()
  let visibilityState: 'visible' | 'hidden' = initialVisibility
  return {
    addEventListener: target.addEventListener,
    removeEventListener: target.removeEventListener,
    dispatch: target.dispatch,
    get visibilityState() {
      return visibilityState
    },
    set visibilityState(v: 'visible' | 'hidden') {
      visibilityState = v
    },
  }
}

describe('attachRecheckListeners（#133 D3）', () => {
  it('T-3: visibilitychange（visible）で onRecheck が1回呼ばれる。hidden では呼ばれない', () => {
    const doc = makeFakeDocument('visible')
    const win = makeFakeTarget()
    let calls = 0
    let t = 0
    attachRecheckListeners(doc, win, () => calls++, () => t)

    doc.visibilityState = 'hidden'
    doc.dispatch('visibilitychange')
    expect(calls).toBe(0)

    t = 10000
    doc.visibilityState = 'visible'
    doc.dispatch('visibilitychange')
    expect(calls).toBe(1)
  })

  it('T-4: focus と visibilitychange が連続しても onRecheck は1回（1秒未満はデバウンス）', () => {
    const doc = makeFakeDocument('visible')
    const win = makeFakeTarget()
    let calls = 0
    let t = 0
    attachRecheckListeners(doc, win, () => calls++, () => t)

    t = 5000
    doc.dispatch('visibilitychange')
    t = 5100 // 1秒未満
    win.dispatch('focus')
    expect(calls).toBe(1)

    t = 6200 // 1秒以上経過していれば再度呼ばれる
    win.dispatch('focus')
    expect(calls).toBe(2)
  })

  it('T-5: アンマウント後（購読解除後）はイベントで onRecheck が呼ばれない', () => {
    const doc = makeFakeDocument('visible')
    const win = makeFakeTarget()
    let calls = 0
    let t = 0
    const detach = attachRecheckListeners(doc, win, () => calls++, () => t)

    detach()

    t = 10000
    doc.dispatch('visibilitychange')
    win.dispatch('focus')
    expect(calls).toBe(0)
  })
})
