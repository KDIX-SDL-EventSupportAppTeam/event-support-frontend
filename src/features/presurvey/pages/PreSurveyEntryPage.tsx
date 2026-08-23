import { Link, Navigate, useParams } from 'react-router-dom'
import { usePreSurveySessionStore } from '@/features/presurvey/store/presurveySessionStore'
import { PreSurveyLayout } from '@/features/presurvey/components/PreSurveyLayout'

/**
 * /pre-survey/:eventId
 * 参加者に配布する URL の入口。初回はサインアップ、2 回目以降はサインインへ振り分ける。
 * 同じセッションで回答済みの場合は完了画面へ直行する。
 */
export function PreSurveyEntryPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const participant = usePreSurveySessionStore((s) => s.participant)

  if (!eventId) {
    return (
      <PreSurveyLayout title="事前アンケート">
        <p className="text-danger text-center mb-0">イベント ID が指定されていません。</p>
      </PreSurveyLayout>
    )
  }

  // 同じ端末でサインイン済み → 回答状況に応じて先へ飛ばす
  if (participant && participant.event_id === eventId) {
    const to = participant.has_answered
      ? `/pre-survey/${eventId}/thanks`
      : `/pre-survey/${eventId}/form`
    return <Navigate to={to} replace />
  }

  return (
    <PreSurveyLayout title="事前アンケート" subtitle={`イベント ID: ${eventId}`}>
      <p className="text-center mb-4">
        当日をより良い体験にするため、事前アンケートへのご回答をお願いします。所要時間は 1〜2 分です。
      </p>
      <div className="d-grid gap-2">
        <Link to={`/pre-survey/${eventId}/signup`} className="btn btn-primary btn-lg">
          はじめての方（サインアップ）
        </Link>
        <Link to={`/pre-survey/${eventId}/signin`} className="btn btn-outline-primary btn-lg">
          2 回目以降の方（サインイン）
        </Link>
      </div>
    </PreSurveyLayout>
  )
}
