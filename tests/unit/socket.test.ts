import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ioMock = vi.fn()

vi.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => ioMock(...args),
}))

let dataSourceMode: 'api' | 'sample' = 'api'
vi.mock('@/shared/data/createEventDataSource', () => ({
  resolveEventDataSourceMode: () => dataSourceMode,
}))

function makeFakeSocket() {
  const listeners = new Map<string, Set<(...a: unknown[]) => void>>()
  return {
    on: vi.fn((event: string, handler: (...a: unknown[]) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(handler)
    }),
    off: vi.fn((event: string, handler: (...a: unknown[]) => void) => {
      listeners.get(event)?.delete(handler)
    }),
    disconnect: vi.fn(),
    _listeners: listeners,
  }
}

describe('shared/api/socket（#132）', () => {
  let useAuthStore: typeof import('@/shared/auth/authStore').useAuthStore
  let subscribeSocket: typeof import('@/shared/api/socket').subscribeSocket
  let bindSocketToAuth: typeof import('@/shared/api/socket').bindSocketToAuth
  let __resetSocketForTest: typeof import('@/shared/api/socket').__resetSocketForTest

  beforeEach(async () => {
    vi.resetModules()
    ioMock.mockReset()
    dataSourceMode = 'api'
    ;({ useAuthStore } = await import('@/shared/auth/authStore'))
    ;({ subscribeSocket, bindSocketToAuth, __resetSocketForTest } = await import('@/shared/api/socket'))
    useAuthStore.getState().clearSession()
    __resetSocketForTest()
  })

  afterEach(() => {
    __resetSocketForTest()
  })

  function login(token: string) {
    useAuthStore.getState().setSession(token, {
      id: 'u1',
      event_id: 'e1',
      display_name: 'テスト',
      role: 'manager',
    } as never)
  }

  it('T-1: 同じトークンで subscribeSocket を3回 → io の呼び出しは1回', () => {
    ioMock.mockReturnValue(makeFakeSocket())
    login('token-a')

    subscribeSocket('checkin:new', vi.fn())
    subscribeSocket('checkin:new', vi.fn())
    subscribeSocket('rating:new', vi.fn())

    expect(ioMock).toHaveBeenCalledTimes(1)
  })

  it('T-2: 全購読を解除しても disconnect は呼ばれない', () => {
    const fakeSocket = makeFakeSocket()
    ioMock.mockReturnValue(fakeSocket)
    login('token-a')

    const unsub1 = subscribeSocket('checkin:new', vi.fn())
    const unsub2 = subscribeSocket('rating:new', vi.fn())
    unsub1()
    unsub2()

    expect(fakeSocket.disconnect).not.toHaveBeenCalled()
  })

  it('T-3: clearSession → disconnect が1回呼ばれる', () => {
    const fakeSocket = makeFakeSocket()
    ioMock.mockReturnValue(fakeSocket)
    bindSocketToAuth()
    login('token-a')
    subscribeSocket('checkin:new', vi.fn())

    useAuthStore.getState().clearSession()

    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1)
  })

  it('T-4: トークン変更 → 旧ソケットが disconnect、新ソケットが作られ、登録済みハンドラが新ソケットに on されている', () => {
    const socketA = makeFakeSocket()
    const socketB = makeFakeSocket()
    ioMock.mockReturnValueOnce(socketA).mockReturnValueOnce(socketB)
    bindSocketToAuth()
    login('token-a')

    const handler = vi.fn()
    subscribeSocket('checkin:new', handler)
    expect(socketA.on).toHaveBeenCalledWith('checkin:new', handler)

    login('token-b')

    expect(socketA.disconnect).toHaveBeenCalledTimes(1)
    expect(ioMock).toHaveBeenCalledTimes(2)
    expect(socketB.on).toHaveBeenCalledWith('checkin:new', handler)
  })

  it('T-5: io に渡す transports が [websocket, polling]', () => {
    ioMock.mockReturnValue(makeFakeSocket())
    login('token-a')
    subscribeSocket('checkin:new', vi.fn())

    expect(ioMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ transports: ['websocket', 'polling'] }),
    )
  })

  it('T-6: サンプルモードでは io が呼ばれない', () => {
    dataSourceMode = 'sample'
    ioMock.mockReturnValue(makeFakeSocket())
    login('token-a')

    subscribeSocket('checkin:new', vi.fn())

    expect(ioMock).not.toHaveBeenCalled()
  })
})
