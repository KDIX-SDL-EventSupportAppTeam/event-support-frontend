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

/**
 * フェーズの表示名。推薦エンジンの方式は「ランダム → DRSA」の2段（recommend ADR 0010）だが、
 * 契約の phase の値は変えず、ランダム期は COVERAGE として返る。値そのものも隠さない
 * （ログ・記録と照合できるように）。未知の値はそのまま出す。
 */
const PHASE_LABEL: Record<string, string> = {
  COVERAGE: 'ランダム（COVERAGE）',
  DRSA: 'DRSA',
  SIMILARITY: 'SIMILARITY（自動では使わない）',
}
export function phaseLabel(phase: string | undefined): string | null {
  if (!phase) return null
  return PHASE_LABEL[phase] ?? phase
}

/**
 * 表示のためだけの引き算（README:42 が許可）。材料が欠けていれば null（数字を作らない）。
 * 段階は「ランダム → DRSA」なので、次のしきい値は常に DRSA（phase_similarity_min は使わない）。
 */
export function remainingToNext(state: RecommenderOpsState): { label: string } | null {
  const size = state.snapshot?.decision_table_size
  const drsa = state.config?.phase_drsa_min
  if (typeof size !== 'number' || typeof drsa !== 'number') return null
  if (size < drsa) return { label: `DRSA まであと ${drsa - size} 件` }
  return { label: 'しきい値は到達済み（品質ゲート待ち）' }
}

/** フォールバック率のしきい値（analytics 03-live-dashboard.md §1 と同じ 10% / 30%） */
export function fallbackLevel(rate: number): 'ok' | 'warning' | 'danger' {
  if (rate >= 0.3) return 'danger'
  if (rate >= 0.1) return 'warning'
  return 'ok'
}
