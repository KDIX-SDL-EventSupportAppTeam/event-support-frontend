import { Navigate } from 'react-router-dom'
import { useOrganizerStore } from '@/features/organizer/store/organizerStore'

/**
 * オーガナイザーとしてログイン済みの場合のみ children を表示する。
 * 未ログインの場合は /organizer/login へリダイレクトする。
 */
export function RequireOrganizer({ children }: { children: React.ReactNode }) {
  const token = useOrganizerStore((s) => s.token)
  const organizer = useOrganizerStore((s) => s.organizer)

  if (!token || !organizer) {
    return <Navigate to="/organizer/login" replace />
  }

  return children
}
