import { AdminShell } from '@/features/admin/components/AdminShell'
import { EventDataClearPanel } from '@/features/admin/components/EventDataClearPanel'
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
            テスト用サンプルの生成・削除、手動テストデータを含むイベント全データのリセット
          </p>
        </div>
        <SampleDataPanel eventId={eventId} />
        <EventDataClearPanel eventId={eventId} />
      </div>
    </AdminShell>
  )
}
