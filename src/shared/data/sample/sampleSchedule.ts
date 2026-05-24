import type { ScheduleDay } from '@/shared/types/eventContent'

export type { ScheduleDay } from '@/shared/types/eventContent'
export const SAMPLE_SCHEDULE: ScheduleDay[] = [
  {
    dayTitle: 'DAY1 10/10(Fri.)',
    events: [
      { time: '12:30', title: '開会セレモニー' },
      { time: '13:00', title: '出展者ピッチ&会場展示、アワード投票' },
      { time: '16:00', title: '投票終了' },
      { time: '16:00', title: 'アイデア・スプリント(NTTEDX)' },
      { time: '17:30', title: '閉会' },
    ],
  },
  {
    dayTitle: 'DAY2 10/11(Sat.)',
    events: [
      { time: '11:00', title: '開会セレモニー' },
      { time: '11:30', title: '会場展示、アワード投票' },
      { time: '13:30', title: 'アイデア・スプリント(未病マーカー、プラクス)' },
      { time: '15:30', title: 'アワード表彰式' },
      { time: '16:30', title: '閉会' },
    ],
  },
]
