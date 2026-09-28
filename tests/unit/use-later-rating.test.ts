import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchV1CheckinsMock = vi.fn()
const postV1CheckInRatingMock = vi.fn()

beforeEach(() => {
  fetchV1CheckinsMock.mockReset()
  postV1CheckInRatingMock.mockReset()
})

vi.mock('@/shared/api/v1Participant', () => ({
  fetchV1Checkins: (...args: unknown[]) => fetchV1CheckinsMock(...args),
  postV1CheckInRating: (...args: unknown[]) => postV1CheckInRatingMock(...args),
}))

const { ApiError } = await import('@/shared/api/unwrap')
const { resolveLaterRatingTarget, submitLaterRating } = await import('@/features/checkin/hooks/useLaterRating')

/**
 * `useLaterRating`（issue #115）の判定・送信ロジック。
 * このリポジトリには React コンポーネント／フックのレンダリングテスト基盤が無いため、
 * フック本体から分離した純粋な非同期関数（`resolveLaterRatingTarget` / `submitLaterRating`）
 * を直接検証する（`use-app-access.test.ts` と同じ方針）。
 */
describe('resolveLaterRatingTarget（issue #115）', () => {
  it('T-1: rated: true のブースは評価対象にならず「評価済み」エラーになる', async () => {
    fetchV1CheckinsMock.mockResolvedValueOnce([
      { id: 'chk-1', booth_id: 'booth-1', booth_name: 'ブースA', method: 'qr', checked_in_at: '', synced_at: null, rated: true },
    ])
    const result = await resolveLaterRatingTarget('evt-1', 'booth-1', 'ブースA', false)
    expect(result.target).toBeNull()
    expect(result.error).toBe('このブースは既に評価済みです。')
  })

  it('チェックイン履歴が無いブースはエラーになる', async () => {
    fetchV1CheckinsMock.mockResolvedValueOnce([])
    const result = await resolveLaterRatingTarget('evt-1', 'booth-x', 'ブースX', false)
    expect(result.target).toBeNull()
    expect(result.error).toBe('チェックイン履歴が見つかりませんでした。')
  })

  it('未評価のチェックインは target を返す', async () => {
    fetchV1CheckinsMock.mockResolvedValueOnce([
      { id: 'chk-1', booth_id: 'booth-1', booth_name: 'ブースA', method: 'qr', checked_in_at: '', synced_at: null, rated: false },
    ])
    const result = await resolveLaterRatingTarget('evt-1', 'booth-1', 'ブースA', false)
    expect(result.error).toBeNull()
    expect(result.target).toEqual({ checkinId: 'chk-1', boothName: 'ブースA', boothId: 'booth-1' })
  })

  it('サンプルモードでは API を呼ばず target を返す', async () => {
    const result = await resolveLaterRatingTarget('evt-1', 'booth-1', 'ブースA', true)
    expect(fetchV1CheckinsMock).not.toHaveBeenCalled()
    expect(result.target).toEqual({ checkinId: 'sample', boothName: 'ブースA', boothId: 'booth-1' })
  })
})

describe('submitLaterRating（issue #115）', () => {
  const target = { checkinId: 'chk-1', boothName: 'ブースA', boothId: 'booth-1' }

  it('T-2: 星0で完了 → API が呼ばれない', async () => {
    const result = await submitLaterRating('evt-1', target, 0, '', false)
    expect(postV1CheckInRatingMock).not.toHaveBeenCalled()
    expect(result.rated).toBe(false)
  })

  it('T-3: 409 → 「既に評価済み」メッセージ', async () => {
    postV1CheckInRatingMock.mockRejectedValueOnce(new ApiError('CONFLICT', '重複'))
    const result = await submitLaterRating('evt-1', target, 3, '', false)
    expect(result.error).toBe('このブースは既に評価済みです。')
    expect(result.rated).toBe(false)
  })

  it('成功時は context: MANUAL で送信し rated: true を返す', async () => {
    postV1CheckInRatingMock.mockResolvedValueOnce(undefined)
    const result = await submitLaterRating('evt-1', target, 3, 'よかった', false)
    expect(postV1CheckInRatingMock).toHaveBeenCalledWith('evt-1', 'chk-1', 3, 'よかった', 'MANUAL')
    expect(result.rated).toBe(true)
    expect(result.error).toBeNull()
  })

  it('target が無ければ何もしない', async () => {
    const result = await submitLaterRating('evt-1', null, 3, '', false)
    expect(postV1CheckInRatingMock).not.toHaveBeenCalled()
    expect(result.rated).toBe(false)
  })
})
