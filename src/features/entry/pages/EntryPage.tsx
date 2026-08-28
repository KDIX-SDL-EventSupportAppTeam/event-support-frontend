import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { completeOnboarding, fetchMeState, type MeState } from '@/features/entry/api/meState'
import { resolveEntryStep } from '@/features/entry/lib/resolveEntryStep'
import { EntryLayout } from '@/features/entry/components/EntryLayout'
import { AuthStep } from '@/features/entry/steps/AuthStep'
import { VerifyEmailStep } from '@/features/entry/steps/VerifyEmailStep'
import { SurveyStep } from '@/features/entry/steps/SurveyStep'
import { WaitingStep } from '@/features/entry/steps/WaitingStep'
import { OnboardingFlow } from '@/features/onboarding/components/OnboardingFlow'
import { useAppAccess } from '@/shared/hooks/useAppAccess'
import { useAuthStore } from '@/shared/auth/authStore'
import { rememberEventId } from '@/shared/lib/lastEventId'

/**
 * `/e/:eventId` ── 参加者が触る唯一の URL。
 *
 * URL は段階を持たない。踏むたびに `GET /me/state` を 1 回呼び、その戻り値だけで
 * サインイン・メール確認・アンケート・開放待ち・オンボーディングのどれを描くかを決める。
 * これにより、利用者がどこで中断しても同じ URL を踏み直せば続きから再開する
 * （回答から開放まで数日空き、その間に端末が変わり得るため、状態は端末に持たない）。
 */
export function EntryPage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  const [meState, setMeState] = useState<MeState | null>(null)

  const hasToken = Boolean(token)
  const eventMatches = user?.event_id === eventId

  // 未認証でも配布リンクを踏んだ事実を控える（セッション切れ時の戻り先。R3）
  useEffect(() => {
    rememberEventId(eventId)
  }, [eventId])

  const reload = useCallback(() => {
    if (!eventId || !hasToken || !eventMatches) return
    fetchMeState(eventId)
      .then(setMeState)
      .catch(() => {
        /* 取得できないときは loading のまま。復帰は利用者の再読込に任せる */
      })
  }, [eventId, hasToken, eventMatches])

  useEffect(() => {
    reload()
  }, [reload])

  /**
   * 開放ゲートの監視は「回答済みなのに未開放」のときだけ動かす。
   * それ以外の段階では待つ理由が無く、30 秒ポーリングは無駄な負荷になる。
   */
  const needsGateWatch = Boolean(meState?.survey_answered && !meState.app_access.is_open)
  const { access, isOpen: liveIsOpen, remainingMs } = useAppAccess(
    needsGateWatch ? eventId : undefined,
  )
  const isOpen = Boolean(meState?.app_access.is_open) || liveIsOpen

  const step = resolveEntryStep({
    hasToken,
    eventMatches,
    role: user?.role,
    meState,
    isOpen,
  })

  if (!eventId) {
    return (
      <EntryLayout title="イベントが指定されていません">
        <p className="text-center mb-0">お手元の QR コードまたは配布リンクから開いてください。</p>
      </EntryLayout>
    )
  }

  switch (step) {
    case 'auth':
      return <AuthStep eventId={eventId} onAuthenticated={reload} />

    case 'loading':
      return (
        <EntryLayout title="読み込んでいます">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">読み込み中</span>
            </div>
          </div>
        </EntryLayout>
      )

    case 'verify':
      return <VerifyEmailStep onRecheck={reload} />

    case 'survey':
      return <SurveyStep eventId={eventId} onAnswered={reload} />

    case 'waiting':
      return <WaitingStep access={access} remainingMs={remainingMs} />

    case 'onboarding':
      return (
        <OnboardingFlow
          onFinish={() => {
            // 打刻の成否に関わらずアプリへ通す。ここで足止めする理由は無く、
            // 失敗しても次回にもう一度表示されるだけで実害が小さい。
            void completeOnboarding(eventId).finally(() => navigate('/home', { replace: true }))
          }}
        />
      )

    case 'app':
      return <Navigate to={user?.role === 'exhibitor' ? '/exhibitor' : '/home'} replace />
  }
}
