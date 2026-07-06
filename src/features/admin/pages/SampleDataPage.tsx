import { AdminShell } from '@/features/admin/components/AdminShell'
import { SampleDataPanel } from '@/features/admin/components/SampleDataPanel'
import { useAuthStore } from '@/features/auth/store/authStore'

export function SampleDataPage() {
  const eventId = useAuthStore((s) => s.user?.event_id)

  if (!eventId) {
    return (
      <AdminShell>
        <p className="text-danger">イベント ID が取得できません</p>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <div className="d-flex flex-column gap-3">
        <div>
          <h1 className="h5 fw-bold mb-1">
            <i className="bi bi-database-gear me-1" />
            データ編集
          </h1>
          <p className="text-muted small mb-0">
            テスト用サンプルデータの生成・削除
          </p>
        </div>
        <SampleDataPanel eventId={eventId} />
      </div>
    </AdminShell>
  )
}
