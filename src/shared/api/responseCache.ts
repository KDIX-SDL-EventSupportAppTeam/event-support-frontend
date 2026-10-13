import { useAuthStore } from '@/shared/auth/authStore'

/**
 * GET レスポンスの小さなメモリキャッシュ。
 *
 * DB はさくらプロキシ経由（SQL 1本ごとに HTTPS 1往復）なので、リクエスト数がそのまま負荷になる。
 * ホーム表示のたびに取り直していた値（イベント名・投票状況）を、ページを再読み込みするまで
 * （または TTL の間）使い回す。
 *
 * - 同時に呼ばれたときは Promise を共有して二重に呼ばない
 * - 失敗した Promise は残さない（次の呼び出しで取り直す）
 * - ログアウト・トークン変更で全消去する（別の人に前の人の値を見せない）
 */

type Entry = { promise: Promise<unknown>; expiresAt: number }

const entries = new Map<string, Entry>()

/** `ttlMs` を省略するとページを再読み込みするまで有効。 */
export function cachedFetch<T>(key: string, loader: () => Promise<T>, ttlMs?: number): Promise<T> {
  const hit = entries.get(key)
  if (hit && hit.expiresAt > Date.now()) return hit.promise as Promise<T>

  const promise = loader()
  const entry: Entry = {
    promise,
    expiresAt: ttlMs === undefined ? Number.POSITIVE_INFINITY : Date.now() + ttlMs,
  }
  entries.set(key, entry)
  promise.catch(() => {
    if (entries.get(key) === entry) entries.delete(key)
  })
  return promise
}

/** 指定キーのキャッシュを破棄する。 */
export function invalidateCache(key: string): void {
  entries.delete(key)
}

/** 全消去（ログアウト・トークン変更時、およびテスト用）。 */
export function clearAllCaches(): void {
  entries.clear()
}

let lastToken = useAuthStore.getState().token
useAuthStore.subscribe((state) => {
  if (state.token === lastToken) return
  lastToken = state.token
  clearAllCaches()
})
