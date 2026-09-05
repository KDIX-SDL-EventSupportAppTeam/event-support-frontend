import type { RecommenderOpsState, RecommenderStateReason } from '@/shared/api/v1Admin'

/** docs/specs/admin-live-monitoring/README.md の表と一字一句合わせる */
export const REASON_MESSAGE: Record<RecommenderStateReason, string> = {
  UNCONFIGURED: '推薦エンジンが未設定です',
  UNAUTHORIZED: '推薦エンジンの認証に失敗しています（設定の問題）',
  UNREACHABLE: '推薦エンジンに接続できません',
  BAD_RESPONSE: '推薦エンジンの応答が読めません',
}
export function reasonMessage(reason: RecommenderStateReason): string {
  return REASON_MESSAGE[reason] ?? `推薦エンジンの状態が不明です（${reason}）`
}

/** 表示のためだけの引き算（README:42 が許可）。材料が欠けていれば null（数字を作らない） */
export function remainingToNext(state: RecommenderOpsState): { label: string } | null {
  const size = state.snapshot?.decision_table_size
  const sim = state.config?.phase_similarity_min
  const drsa = state.config?.phase_drsa_min
  if (typeof size !== 'number' || typeof sim !== 'number' || typeof drsa !== 'number') return null
  if (size < sim) return { label: `SIMILARITY まであと ${sim - size} 件` }
  if (size < drsa) return { label: `DRSA まであと ${drsa - size} 件` }
  return { label: 'しきい値は到達済み（品質ゲート待ち）' }
}

/** フォールバック率のしきい値（analytics 03-live-dashboard.md §1 と同じ 10% / 30%） */
export function fallbackLevel(rate: number): 'ok' | 'warning' | 'danger' {
  if (rate >= 0.3) return 'danger'
  if (rate >= 0.1) return 'warning'
  return 'ok'
}
