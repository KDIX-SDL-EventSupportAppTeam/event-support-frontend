import type { VoteAwardCategory } from '@/types/voteAward'

/** 旧 AwardVoteView のカラー帯に合わせたサンプル */
export const SAMPLE_VOTE_AWARDS: VoteAwardCategory[] = [
  {
    name: '来場者賞',
    description: 'チェックインしたブースの中から、最も印象に残った展示に投票してください。',
    color: 'pink',
  },
  {
    name: 'スタッフ賞',
    description: '運営スタッフおすすめの展示を選ぶ部門です。',
    color: 'purple',
  },
]
