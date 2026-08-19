import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/shared/auth/authStore'
import { PreSurveyLayout } from '@/features/presurvey/components/PreSurveyLayout'

/**
 * /pre-survey/:eventId/thanks
 * 回答完了画面。アプリ本体への遷移ボタンを置く。
 * 2 回目以降のサインインではこの画面に直接遷移する。
 */
export function PreSurveyThanksPage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)

  // アプリ本体にログイン済みならホーム、未ログインならイベント参加登録へ
  const appPath = token ? '/home' : `/join/${eventId}`

  return (
    <PreSurveyLayout title="ご回答ありがとうございました">
      <p className="text-center mb-4">
        当日はいただいた内容を参考に、より楽しんでいただけるよう準備いたします。
      </p>
      <div className="d-grid">
        <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate(appPath)}>
          アプリに移動する
        </button>
      </div>
    </PreSurveyLayout>
  )
}
