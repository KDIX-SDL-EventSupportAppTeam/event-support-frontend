import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useExhibitorStore } from '@/features/exhibitor/store/exhibitorStore'
import { fetchExhibitorBooths } from '@/shared/api/v1Exhibitor'
import { isMockAuthEnabled } from '@/shared/auth/mockSession'

vi.mock('@/shared/api/v1Exhibitor')
vi.mock('@/shared/auth/mockSession')

const mockedFetchExhibitorBooths = vi.mocked(fetchExhibitorBooths)
const mockedIsMockAuthEnabled = vi.mocked(isMockAuthEnabled)

function resetStore() {
  useExhibitorStore.setState({ loaded: false, loadedKey: null, isExhibitor: false, booths: [] })
}

describe('useExhibitorStore.ensureLoaded', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedIsMockAuthEnabled.mockReturnValue(false)
    resetStore()
  })

  it('同一 userId:eventId キーでは再fetchしない', async () => {
    mockedFetchExhibitorBooths.mockResolvedValue({
      is_exhibitor: true,
      booths: [{ id: 'b-1', name: 'ブース1' }],
    })

    await useExhibitorStore.getState().ensureLoaded('evt-1', 'user-1')
    await useExhibitorStore.getState().ensureLoaded('evt-1', 'user-1')

    expect(mockedFetchExhibitorBooths).toHaveBeenCalledTimes(1)
    expect(useExhibitorStore.getState().isExhibitor).toBe(true)
  })

  it('別ユーザー/イベントのキーでは取り直す', async () => {
    mockedFetchExhibitorBooths.mockResolvedValue({ is_exhibitor: true, booths: [] })
    await useExhibitorStore.getState().ensureLoaded('evt-1', 'user-1')

    mockedFetchExhibitorBooths.mockResolvedValue({ is_exhibitor: false, booths: [] })
    await useExhibitorStore.getState().ensureLoaded('evt-2', 'user-1')

    expect(mockedFetchExhibitorBooths).toHaveBeenCalledTimes(2)
    expect(useExhibitorStore.getState().loadedKey).toBe('user-1:evt-2')
    expect(useExhibitorStore.getState().isExhibitor).toBe(false)
  })

  it('API失敗時は isExhibitor=false（fail-closed）', async () => {
    mockedFetchExhibitorBooths.mockRejectedValue(new Error('network error'))

    await useExhibitorStore.getState().ensureLoaded('evt-1', 'user-1')

    const state = useExhibitorStore.getState()
    expect(state.isExhibitor).toBe(false)
    expect(state.loaded).toBe(true)
    expect(state.booths).toEqual([])
  })

  it('reset() で初期状態にクリアされる', async () => {
    mockedFetchExhibitorBooths.mockResolvedValue({
      is_exhibitor: true,
      booths: [{ id: 'b-1', name: 'ブース1' }],
    })
    await useExhibitorStore.getState().ensureLoaded('evt-1', 'user-1')

    useExhibitorStore.getState().reset()

    expect(useExhibitorStore.getState()).toMatchObject({
      loaded: false,
      loadedKey: null,
      isExhibitor: false,
      booths: [],
    })
  })

  it('モックモード時は API を呼ばず false のまま', async () => {
    mockedIsMockAuthEnabled.mockReturnValue(true)

    await useExhibitorStore.getState().ensureLoaded('evt-1', 'user-1')

    expect(mockedFetchExhibitorBooths).not.toHaveBeenCalled()
    const state = useExhibitorStore.getState()
    expect(state.isExhibitor).toBe(false)
    expect(state.loaded).toBe(true)
    expect(state.loadedKey).toBe('user-1:evt-1')
  })
})
