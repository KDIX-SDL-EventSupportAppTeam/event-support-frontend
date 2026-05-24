export type ScheduleEventItem = { time: string; title: string }

export type ScheduleDay = { dayTitle: string; events: ScheduleEventItem[] }

export type QaItem = { question: string; answer: string }
