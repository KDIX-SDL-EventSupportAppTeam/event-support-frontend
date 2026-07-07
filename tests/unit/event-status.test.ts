import { describe, expect, it } from 'vitest'
import { eventStatus, formatRemaining } from '@/shared/lib/eventStatus'

const START = '2026-08-01T01:00:00Z'
const END = '2026-08-01T09:00:00Z'
const startMs = new Date(START).getTime()
const endMs = new Date(END).getTime()

describe('eventStatus', () => {
  it('開始直前は準備中', () => {
    const s = eventStatus(START, END, startMs - 1)
    expect(s.key).toBe('upcoming')
    expect(s.label).toBe('準備中')
    expect(s.className).toBe('bg-secondary')
  })

  it('開始時刻ちょうどは開催中', () => {
    expect(eventStatus(START, END, startMs).key).toBe('ongoing')
  })

  it('終了時刻ちょうどは開催中（境界を含む）', () => {
    const s = eventStatus(START, END, endMs)
    expect(s.key).toBe('ongoing')
    expect(s.className).toBe('bg-success')
  })

  it('終了後は終了', () => {
    const s = eventStatus(START, END, endMs + 1)
    expect(s.key).toBe('ended')
    expect(s.label).toBe('終了')
    expect(s.className).toBe('bg-dark')
  })
})

describe('formatRemaining', () => {
  it('開始前は「開始まで H時間M分」', () => {
    expect(formatRemaining(START, END, startMs - (2 * 60 + 30) * 60000)).toBe('開始まで 2時間30分')
  })

  it('開催中は「終了まで H時間M分」', () => {
    expect(formatRemaining(START, END, endMs - (1 * 60 + 5) * 60000)).toBe('終了まで 1時間5分')
  })

  it('終了後は null', () => {
    expect(formatRemaining(START, END, endMs + 1)).toBeNull()
  })
})
