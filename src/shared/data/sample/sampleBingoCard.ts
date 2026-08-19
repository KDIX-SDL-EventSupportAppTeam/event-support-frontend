import { hashSeed, LINE_INDEXES, mulberry32, shuffleWithRng } from '@/shared/data/sample/bingoRandom'
import { pickCheckedInBoothIds } from '@/shared/data/sample/SampleEventData'
import { SAMPLE_LEGACY_BOOTHS } from '@/shared/data/sample/sampleBooths'
import { readSampleExtraCheckedIds } from '@/shared/data/sample/sampleSession'
import type { BingoCard, BingoCell, BingoCellBooth } from '@/shared/types/bingoCard'
import type { LegacyBooth } from '@/shared/types/legacyBooth'

/**
 * サンプルモード用の段階解放ビンゴカード生成。
 * API を叩けない環境（`VITE_DATA_SOURCE=sample`）で画面確認するためのもの。
 * 仕様: docs/.sdd/05-state-api/types-and-client.md「サンプルモード」
 *
 * `docs/.sdd/06-open-questions/open-questions.md` Q-F2 に従い、段階数はハードコードせず
 * 定数として保持する（サーバー既定と同じ 3）。
 */
const CENTER_POSITIONS: readonly number[] = [5, 6, 9, 10]
const SAMPLE_RATING_SCALE = 3
const MAX_COINS = 4

function boothInfo(b: LegacyBooth): BingoCellBooth {
  return { id: b.booth_id, name: b.booth_name, manual_code: b.booth_display_code ?? b.booth_id }
}

function emptyCell(position: number): BingoCell {
  return {
    position,
    zone: CENTER_POSITIONS.includes(position) ? 'CENTER' : 'OUTER',
    state: 'LOCKED',
    source: null,
    booth: null,
    reason: null,
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

  const cells: BingoCell[] = Array.from({ length: 16 }, (_, position) => emptyCell(position))

  // 中央2x2: 先頭1マスは参加ボーナスで達成済み、残り3マスは訪問順に埋まる
  const [bonusPos, ...remainingCenter] = CENTER_POSITIONS
  cells[bonusPos!] = { ...cells[bonusPos!]!, state: 'ACHIEVED', source: 'SIGNUP_BONUS', booth: null }
  remainingCenter.forEach((pos) => {
    cells[pos] = { ...cells[pos]!, state: 'EMPTY' }
  })

  const centerFillTargets = visited.slice(0, remainingCenter.length)
  centerFillTargets.forEach((boothId, i) => {
    const booth = booths.find((b) => b.booth_id === boothId)
    const pos = remainingCenter[i]
    if (!booth || pos === undefined) return
    cells[pos] = { ...cells[pos]!, state: 'ACHIEVED', source: 'FREE_VISIT', booth: boothInfo(booth) }
  })

  const centerFilled = 1 + centerFillTargets.length
  const unlocked = visited.length >= 3
  const status: BingoCard['status'] = unlocked ? 'UNLOCKED' : 'CENTER_ONLY'

  if (unlocked) {
    const outerPositions = cells.map((c) => c.position).filter((p) => !CENTER_POSITIONS.includes(p))
    const postUnlockVisited = new Set(visited.slice(remainingCenter.length))
    const recommendBooths = shuffledBooths.slice(0, outerPositions.length)
    outerPositions.forEach((pos, i) => {
      const booth = recommendBooths[i % Math.max(1, recommendBooths.length)]
      if (!booth) return
      const achieved = postUnlockVisited.has(booth.booth_id)
      cells[pos] = {
        ...cells[pos]!,
        state: achieved ? 'ACHIEVED' : 'EMPTY',
        source: 'RECOMMEND',
        booth: boothInfo(booth),
      }
    })
  }

  const achievedPositions = new Set(cells.filter((c) => c.state === 'ACHIEVED').map((c) => c.position))
  let lines = 0
  for (const line of LINE_INDEXES) {
    if (line.every((p) => achievedPositions.has(p))) lines++
  }
  const coinsEarned = Math.min(MAX_COINS, lines)

  return {
    card_id: `sample-${eventId}-${userId}`,
    status,
    unlocked_at: unlocked ? new Date().toISOString() : null,
    rating_scale: SAMPLE_RATING_SCALE,
    progress: {
      center_filled: centerFilled,
      center_total: 4,
      visits_to_unlock: Math.max(0, 3 - visited.length),
    },
    coins: { earned: coinsEarned, max: MAX_COINS },
    cells,
  }
}
