import { FormEvent, useState } from 'react'
import { IssuedUrlCard } from '@/features/organizer/components/IssuedUrlCard'
import { StaffInviteForm } from '@/features/organizer/components/StaffInviteForm'
import { createOrganizerEvent, type CreatedEvent } from '@/features/organizer/api/organizerApi'

type FormData = {
  name: string
  dateStart: string
  dateEnd: string
  venue: string
  managerEmail: string
  managerPassword: string
  managerDisplayName: string
}

const EMPTY_FORM: FormData = {
  name: '',
  dateStart: '',
  dateEnd: '',
  venue: '',
  managerEmail: '',
  managerPassword: '',
  managerDisplayName: '',
}

/**
 * /organizer/events/new
 * イベント作成ページ（2ステップ）。
 * Step A: フォーム入力
 * Step B: 発行 URL カードとスタッフ招待
 */
export function OrganizerEventCreatePage() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null)
  const [showStaffForm, setShowStaffForm] = useState(false)

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validate(): string | null {
    if (!form.name.trim()) return 'イベント名は必須です'
    if (!form.dateStart) return '開始日時は必須です'
    if (!form.dateEnd) return '終了日時は必須です'
    if (form.dateEnd <= form.dateStart) return '終了日時は開始日時より後にしてください'
    if (!form.managerEmail.trim()) return '初期マネージャーのメールアドレスは必須です'
    if (form.managerPassword.length < 8) return 'パスワードは8文字以上にしてください'
    return null
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const event = await createOrganizerEvent({
        name: form.name.trim(),
        date_start: form.dateStart,
        date_end: form.dateEnd,
        venue: form.venue.trim() || undefined,
        initial_manager: {
          email: form.managerEmail.trim(),
          password: form.managerPassword,
          display_name: form.managerDisplayName.trim() || undefined,
        },
      })
      setCreatedEvent(event)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message ?? 'イベントの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setCreatedEvent(null)
    setShowStaffForm(false)
    setError(null)
  }

  // --- Step B: 作成完了 ---
  if (createdEvent) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-7">
            <IssuedUrlCard
              participantUrl={createdEvent.participant_url}
              adminUrl={createdEvent.admin_url}
              initialManagerEmail={createdEvent.initial_manager_email}
            />

            <div className="mt-4">
              {!showStaffForm ? (
                <button
                  type="button"
                  className="btn btn-outline-primary me-3"
                  onClick={() => setShowStaffForm(true)}
                >
                  <i className="bi bi-person-plus me-1" />
                  スタッフを追加する
                </button>
              ) : (
                <div className="card border-0 shadow-sm p-3 mb-3">
                  <StaffInviteForm eventId={createdEvent.id} />
                </div>
              )}
              <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                <i className="bi bi-plus-circle me-1" />
                別のイベントを作成
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- Step A: フォーム ---
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-7">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-semibold">
              <i className="bi bi-calendar-plus me-2 text-primary" />
              新しいイベントを作成
            </div>
            <div className="card-body">
              <form onSubmit={onSubmit}>
                {/* イベント情報 */}
                <h2 className="h6 fw-semibold text-muted mb-3">イベント情報</h2>
                <div className="mb-3">
                  <label className="form-label">
                    イベント名 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    placeholder="例: Tech Fes 2026"
                  />
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      開始日時 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={form.dateStart}
                      onChange={(e) => handleChange('dateStart', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">
                      終了日時 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={form.dateEnd}
                      onChange={(e) => handleChange('dateEnd', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label">会場（任意）</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.venue}
                    onChange={(e) => handleChange('venue', e.target.value)}
                    placeholder="例: 東京ビッグサイト"
                  />
                </div>

                {/* 初期マネージャー */}
                <hr />
                <h2 className="h6 fw-semibold text-muted mb-3">初期マネージャー設定</h2>
                <div className="mb-3">
                  <label className="form-label">
                    メールアドレス <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.managerEmail}
                    onChange={(e) => handleChange('managerEmail', e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    パスワード（8文字以上） <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={form.managerPassword}
                    onChange={(e) => handleChange('managerPassword', e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label">表示名（任意）</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.managerDisplayName}
                    onChange={(e) => handleChange('managerDisplayName', e.target.value)}
                    autoComplete="off"
                  />
                </div>

                {error ? <p className="text-danger">{error}</p> : null}
                <div className="d-grid">
                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? '作成中…' : 'イベントを作成する'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
