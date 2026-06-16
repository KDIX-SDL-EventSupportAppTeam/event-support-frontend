import { FormEvent, useEffect, useState } from 'react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAuthStore } from '@/features/auth/store/authStore'
import {
  createAdminSurveyQuestion,
  deleteAdminSurveyQuestion,
  fetchAdminSurveyQuestions,
  type AdminSurveyQuestion,
} from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'

export function SurveyManagePage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const [items, setItems] = useState<AdminSurveyQuestion[]>([])
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState('はい,いいえ')
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    if (!eventId) return
    setItems(await fetchAdminSurveyQuestions(eventId))
  }

  useEffect(() => {
    reload().catch((e) => setError(formatClientError(e, '設問取得に失敗しました')))
  }, [eventId])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!eventId || !questionText.trim()) return
    try {
      await createAdminSurveyQuestion(eventId, {
        question_text: questionText.trim(),
        options: options
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean),
        is_required: true,
      })
      setQuestionText('')
      await reload()
    } catch (err) {
      setError(formatClientError(err, '作成に失敗しました'))
    }
  }

  async function onDelete(id: string) {
    if (!eventId || !confirm('削除しますか？')) return
    try {
      await deleteAdminSurveyQuestion(eventId, id)
      await reload()
    } catch (err) {
      setError(formatClientError(err, '削除に失敗しました'))
    }
  }

  return (
    <AdminShell title="アンケート設問">
      {error ? <p className="text-danger">{error}</p> : null}
      <form className="row g-2 mb-4" onSubmit={onCreate}>
        <div className="col-md-5">
          <input
            className="form-control"
            placeholder="設問文"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />
        </div>
        <div className="col-md-5">
          <input
            className="form-control"
            placeholder="選択肢（カンマ区切り）"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <button type="submit" className="btn btn-primary w-100">
            追加
          </button>
        </div>
      </form>
      <ul className="list-group">
        {items.map((item) => (
          <li key={item.id} className="list-group-item">
            <div className="d-flex justify-content-between gap-2">
              <div>
                <div className="fw-semibold">{item.question_text}</div>
                <div className="small text-muted">{item.options.join(' / ')}</div>
              </div>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(item.id)}>
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </AdminShell>
  )
}
