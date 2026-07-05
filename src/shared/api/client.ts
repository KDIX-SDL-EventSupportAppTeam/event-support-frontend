import axios from 'axios'
import { TOKEN_KEY } from '@/shared/config/storageKeys'
import { useAuthStore } from '@/shared/auth/authStore'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401（トークン無効・期限切れ）を受けたら自動でセッションを破棄してログインへ。
// これがないと無効トークンを掴んだまま「ホームは見えるが API は全部エラー」の
// 詰み状態になり、ログイン画面にも戻れない。
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    const url: string = error?.config?.url ?? ''
    // ログイン/登録の 401（資格情報の誤り）は各画面で扱うため対象外
    const isAuthEndpoint = url.includes('/auth/')
    if (status === 401 && !isAuthEndpoint) {
      const { token, clearSession } = useAuthStore.getState()
      if (token) {
        clearSession()
        const path = window.location.pathname
        const loginPath = path.startsWith('/admin') ? '/admin/login' : '/login'
        if (path !== loginPath) window.location.assign(loginPath)
      }
    }
    return Promise.reject(error)
  },
)
