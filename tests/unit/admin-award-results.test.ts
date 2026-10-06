import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const page = readFileSync(
  path.resolve(__dirname, '../../src/features/admin/pages/AdminAwardResultsPage.tsx'),
  'utf-8',
)

describe('アワード結果画面', () => {
  it('結果 API を使い、順位をフロントで計算していない', () => {
    expect(page).toContain('fetchAdminAwardResults')
    expect(page).not.toMatch(/\.sort\(/)
  })

  it('自動更新は 30 秒間隔', () => {
    expect(page).toContain('POLL_INTERVAL_MS = 30_000')
  })

  it('画面を離れたらタイマーと可視状態の監視を止める（他画面でリクエストを飛ばさない）', () => {
    expect(page).toContain('window.clearInterval(timer)')
    expect(page).toContain("document.removeEventListener('visibilitychange'")
  })

  it('タブが裏にある間は取りに行かない', () => {
    expect(page).toContain("document.visibilityState === 'visible'")
  })
})
