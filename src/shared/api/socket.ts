import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

function resolveSocketBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/api\/v1\/?$/, '')
}

export function connectSocket(token: string, apiBaseUrl: string): Socket {
  disconnectSocket()
  socket = io(resolveSocketBaseUrl(apiBaseUrl), {
    auth: { token },
    transports: ['websocket'],
  })
  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}
