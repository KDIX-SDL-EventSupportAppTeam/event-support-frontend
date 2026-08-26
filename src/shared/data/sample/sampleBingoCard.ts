import { hashSeed, mulberry32, shuffleWithRng } from '@/shared/data/sample/bingoRandom'
import { pickCheckedInBoothIds } from '@/shared/data/sample/SampleEventData'
import { SAMPLE_LEGACY_BOOTHS } from '@/shared/data/sample/sampleBooths'
import { readSampleExtraCheckedIds } from '@/shared/data/sample/sampleSession'
import type { BingoCard, BingoCell, BingoCellBooth, BingoUnlockEvent } from '@/shared/types/bingoCard'
import type { LegacyBooth } from '@/shared/types/legacyBooth'

/**
 * サンプルモード用の動的段階解放ビンゴカード生成。
 * API を叩けない環境（`VITE_DATA_SOURCE=sample`）で画面確認するためのもの。
 * 仕様: docs/specs/bingo-dynamic-unlock/01-card-display.md
 *
 * 段階数はハードコードせず定数として保持する（サーバー既定と同じ 4）。
 */
const CENTER_POSITIONS: readonly number[] = [5, 6, 9, 10]
const SAMPLE_RATING_SCALE = 4

/** 中央ペアと解放される外周マスの対応表（server 03-card-lifecycle/unlock-pairs.md と同一） */
const UNLOCK_PAIRS: readonly { pairKey: string; center: [number, number]; outer: [number, number] }[] = [
  { pairKey: '5-6', center: [5, 6], outer: [4, 7] },
  { pairKey: '9-10', center: [9, 10], outer: [8, 11] },
  { pairKey: '5-9', center: [5, 9], outer: [1, 13] },
  { pairKey: '6-10', center: [6, 10], outer: [2, 14] },
  { pairKey: '5-10', center: [5, 10], outer: [0, 15] },
  { pairKey: '6-9', center: [6, 9], outer: [3, 12] },
]

const LINE_INDEXES: readonly number[][] = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  [0, 5, 10, 15],
  [3, 6, 9, 12],
]

function boothInfo(b: LegacyBooth): BingoCellBooth {
  return {
    id: b.booth_id,
    name: b.booth_name,
    manual_code: b.booth_display_code ?? b.booth_id,
    description: `${b.booth_name}のブースです。`,
  }
}

function closedCell(position: number): BingoCell {
  return {
    position,
    zone: CENTER_POSITIONS.includes(position) ? 'CENTER' : 'OUTER',
    is_revealed: false,
    is_achieved: false,
    source: null,
    booth: null,
  }
}

/** サンプルセッション中にチェックインしたブース ID を、決定論的な基礎データと合わせて返す */
function visitedBoothIds(eventId: string, userId: string): string[] {
  const base = pickCheckedInBoothIds(SAMPLE_LEGACY_BOOTHS, eventId, userId)
  const extra = readSampleExtraCheckedIds(userId)
  return [...new Set([...base, ...extra])]
}

export function buildSampleBingoCard(eventId: string, userId: string): BingoCard {
  const booths = SAMPLE_LEGACY_BOOTHS
  const visited = visitedBoothIds(eventId, userId)
  const rng = mulberry32(hashSeed(`${eventId}|${userId}|bingocard-v2`))
  const shuffledBooths = shuffleWithRng(booths, rng)

  const cells: BingoCell[] = Array.from({ length: 16 }, (_, position) => closedCell(position))

  // position 5 は最初から事前アンケート由来の推薦ブースが見える状態（is_revealed: true, is_achieved: false）
  const presurveyBooth = shuffledBooths[0]
  if (presurveyBooth) {
    cells[5] = { ...cells[5]!, is_revealed: true, source: 'PRESURVEY', booth: boothInfo(presurveyBooth) }
  }

  // 中央の残り3マス（6, 9, 10）は自由訪問で埋まる。訪問順に割り当てる
  const remainingCenter = [6, 9, 10]
  const centerAssignments = new Map<number, LegacyBooth>()
  remainingCenter.forEach((pos, i) => {
    const boothId = visited[i]
    const booth = boothId ? booths.find((b) => b.booth_id === boothId) : undefined
    if (booth) centerAssignments.set(pos, booth)
  })
  // position 5 も「訪問した」とみなせるのは presurveyBooth が visited に含まれる場合
  const centerAchieved = new Set<number>()
  if (presurveyBooth && visited.includes(presurveyBooth.booth_id)) centerAchieved.add(5)
  for (const [pos, booth] of centerAssignments) {
    cells[pos] = { ...cells[pos]!, is_revealed: true, is_achieved: true, source: 'FREE_VISIT', booth: boothInfo(booth) }
    centerAchieved.add(pos)
  }

  // 中央が2マス埋まるたび、成立したペアの外周2マスを解放する（最大3回・過去に成立したものも含めて累積）
  const unlockEvents: BingoUnlockEvent[] = []
  const revealedOuter = new Set<number>()
  for (const pair of UNLOCK_PAIRS) {
    if (pair.center.every((p) => centerAchieved.has(p))) {
      unlockEvents.push({
        pair_key: pair.pairKey,
        released_positions: [...pair.outer],
        unlocked_at: new Date(Date.now() - (UNLOCK_PAIRS.length - unlockEvents.length) * 60_000).toISOString(),
      })
      pair.outer.forEach((p) => revealedOuter.add(p))
    }
  }

  const postUnlockVisited = new Set(visited.slice(remainingCenter.length))
  const outerBoothPool = shuffledBooths.slice(1) // presurveyBooth は中央で使用済み
  let outerIdx = 0
  for (const position of revealedOuter) {
    const booth = outerBoothPool[outerIdx % Math.max(1, outerBoothPool.length)]
    outerIdx++
    if (!booth) continue
    const achieved = postUnlockVisited.has(booth.booth_id)
    cells[position] = {
      ...cells[position]!,
      is_revealed: true,
      is_achieved: achieved,
      source: 'RECOMMEND',
      booth: boothInfo(booth),
    }
  }

  const achievedPositions = new Set(cells.filter((c) => c.is_achieved).map((c) => c.position))
  let linesCompleted = 0
  for (const line of LINE_INDEXES) {
    if (line.every((p) => achievedPositions.has(p))) linesCompleted++
  }

  return {
    card_id: `sample-${eventId}-${userId}`,
    rating_scale: SAMPLE_RATING_SCALE,
    progress: {
      center_achieved: centerAchieved.size,
      center_total: 4,
      revealed_cells: cells.filter((c) => c.is_revealed).length,
      achieved_cells: achievedPositions.size,
    },
    lines_completed: linesCompleted,
    unlock_events: unlockEvents,
    cells,
  }
}
