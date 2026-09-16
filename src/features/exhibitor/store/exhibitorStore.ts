import { create } from 'zustand'
import { fetchExhibitorBooths, type ExhibitorBooth } from '@/shared/api/v1Exhibitor'
import { isMockAuthEnabled } from '@/shared/auth/mockSession'

/**
 * 出展者判定（is_exhibitor/担当ブース）のセッション内キャッシュ。
 *
 * 「切替ボタンを出すか」の判定は localStorage の role だけに頼らない。
 * 一括登録は既ログイン中の参加者に後からロールを付与するため、手元の user.role が
 * 古いままになり得る（server #53 §3 と同じ問題のフロント側）。そこで
 * GET /exhibitor/booths（DB の現在値）をセッション中1回だけ引いてキャッシュする。
 * 仕様: 改修プラン frontend_43_出展者管理画面.md §4-5
 */
type ExhibitorState = {
  loaded: boolean
  loadedKey: string | null // `${userId}:${eventId}`。別ユーザーで再ログインしたら取り直す
  isExhibitor: boolean
  booths: ExhibitorBooth[]
  ensureLoaded: (eventId: string, userId: string) => Promise<void>
  reset: () => void // ログアウト時に呼ぶ（clearSession と併用）
}

export const useExhibitorStore = create<ExhibitorState>((set, get) => ({
  loaded: false,
  loadedKey: null,
  isExhibitor: false,
  booths: [],
  ensureLoaded: async (eventId, userId) => {
    const key = `${userId}:${eventId}`
    if (get().loadedKey === key) return
    if (isMockAuthEnabled()) {
      // モック/サンプルモードに出展者APIは無い（§9 注記-2）
      set({ loaded: true, loadedKey: key, isExhibitor: false, booths: [] })
      return
    }
    try {
      const data = await fetchExhibitorBooths(eventId)
      set({ loaded: true, loadedKey: key, isExhibitor: data.is_exhibitor, booths: data.booths })
    } catch {
      set({ loaded: true, loadedKey: key, isExhibitor: false, booths: [] }) // 失敗時はボタン非表示に倒す
    }
  },
  reset: () => set({ loaded: false, loadedKey: null, isExhibitor: false, booths: [] }),
}))
