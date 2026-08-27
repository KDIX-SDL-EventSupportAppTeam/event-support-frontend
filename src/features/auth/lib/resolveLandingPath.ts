import { hasSeenOnboarding } from '@/shared/lib/onboardingSeen'

/**
 * ログイン後の着地先。出展者だけ出展者ボードへ。
 * それ以外は、この端末でオンボーディングをまだ見ていなければ初回だけ `/onboarding` へ、
 * 既読なら従来どおりホームへ（仕様: docs/specs/design-refresh-2026/06-onboarding.md）。
 */
export function resolveLandingPath(role: string | undefined): string {
  if (role === 'exhibitor') return '/exhibitor'
  return hasSeenOnboarding() ? '/home' : '/onboarding'
}
