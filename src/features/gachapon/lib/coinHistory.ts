import type { GachaCoinUse } from '@/features/gachapon/api/gachaClient'

/** 前の行からこの時間（ミリ秒）以内の行は「1回の使用」としてまとめる。 */
export const SAME_USE_WINDOW_MS = 10_000

/** 1回の使用（連続した複数枚をまとめたもの）。 */
export interface CoinUseGroup {
  /** この回で使った枚数。 */
  count: number
  /** 何枚目から（1 起点。`coin_index + 1`）。 */
  firstNumber: number
  /** 何枚目まで（1 起点）。1枚だけなら `firstNumber` と同じ。 */
  lastNumber: number
  /** 使用時刻（その回の最初の行の `used_at`。ISO 8601）。 */
  usedAt: string
}

/**
 * 使用履歴を「1回の使用」ごとにまとめる。純関数。
 * `coin_index` 昇順に並べ、**前の行から 10 秒以内**なら同じ回とする（10 秒ちょうどはまとめる）。
 * 複数枚をまとめて使うと、1枚ずつ逐次 POST されて数百ミリ秒〜数秒の間隔で行が並ぶため。
 * 時刻が読めない行は、前の行と別の回として扱う（誤ってまとめない）。
 */
export function groupCoinUses(uses: GachaCoinUse[]): CoinUseGroup[] {
  const sorted = [...uses].sort((a, b) => a.coin_index - b.coin_index)
  const groups: CoinUseGroup[] = []
  let prevMs = Number.NaN
  for (const u of sorted) {
    const ms = new Date(u.used_at).getTime()
    const last = groups[groups.length - 1]
    if (last && !Number.isNaN(ms) && !Number.isNaN(prevMs) && ms - prevMs <= SAME_USE_WINDOW_MS) {
      last.count += 1
      last.lastNumber = u.coin_index + 1
    } else {
      groups.push({
        count: 1,
        firstNumber: u.coin_index + 1,
        lastNumber: u.coin_index + 1,
        usedAt: u.used_at,
      })
    }
    prevMs = ms
  }
  return groups
}

function jstParts(d: Date, withSeconds: boolean): string {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hourCycle: 'h23',
  }).formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value.padStart(2, '0') ?? '00'
  return withSeconds ? `${get('hour')}:${get('minute')}:${get('second')}` : `${get('hour')}:${get('minute')}`
}

/** 使用時刻（JST の `HH:mm`）。読めない値はそのまま返す。 */
export function formatJstHm(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : jstParts(d, false)
}

/** 現在時刻（JST の `HH:mm:ss`）。スクリーンショットの使い回しを見分けるために秒まで出す。 */
export function formatJstHms(d: Date): string {
  return jstParts(d, true)
}

/** 「3枚目」「1〜2枚目」。 */
export function coinNumberLabel(g: CoinUseGroup): string {
  return g.firstNumber === g.lastNumber ? `${g.firstNumber}枚目` : `${g.firstNumber}〜${g.lastNumber}枚目`
}
