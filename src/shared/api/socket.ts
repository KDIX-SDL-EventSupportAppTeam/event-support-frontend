import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null
let socketRefCount = 0
let connectedToken: string | null = null

function resolveSocketBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/api\/v1\/?$/, '')
}

export function connectSocket(token: string, apiBaseUrl: string): Socket {
  if (socket?.connected && connectedToken === token) {
    socketRefCount += 1
    return socket
  }

  socket?.disconnect()
  socketRefCount = 1
  connectedToken = token
  socket = io(resolveSocketBaseUrl(apiBaseUrl), {
    auth: { token },
    transports: ['polling', 'websocket'],
  })
  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket(): void {
  if (socketRefCount > 0) socketRefCount -= 1
  if (socketRefCount > 0) return
  socket?.disconnect()
  socket = null
  connectedToken = null
}
