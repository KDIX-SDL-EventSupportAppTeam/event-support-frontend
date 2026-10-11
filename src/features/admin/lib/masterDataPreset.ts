import { PROTOFES_CATEGORIES } from '@/features/admin/lib/protofesPreset'

/**
 * カテゴリ・アワード一括登録画面の「テンプレートを読み込む」で流し込む初期値。
 * 正本は運営が登録ボタンで作成したサーバー側のデータ。ここは入力の手間を省くためだけの値。
 */
export const MASTER_CATEGORY_TEMPLATE: readonly string[] = PROTOFES_CATEGORIES

export type MasterAwardRow = { name: string; description: string; color: string }

/**
 * 本番で実施する事前決定済みのアワード 8 種（資料「プロトフェス OP」）。
 * 色は資料のアイコン色に合わせた専用トークン（legacy-participant-pages.scss の $protofes-award-colors）。
 */
export const MASTER_AWARD_TEMPLATE: readonly MasterAwardRow[] = [
  { name: 'エールアワード', description: 'つい応援したくなったプロトタイプ', color: 'pf-yell' },
  { name: 'スモールスマイルアワード', description: '思わずくすっと笑ってしまうプロトタイプ', color: 'pf-smile' },
  {
    name: 'バックストーリーアワード',
    description: '開発の経緯や目的のストーリー性に惹かれたプロトタイプ',
    color: 'pf-backstory',
  },
  { name: 'ヒラメキアワード', description: '新しい考えのきっかけになったプロトタイプ', color: 'pf-hirameki' },
  { name: 'ハートキャッチアワード', description: '私の悩みに刺さって心をつかまれたプロトタイプ', color: 'pf-heartcatch' },
  {
    name: 'ニューホープアワード',
    description: '既存の概念にとらわれず、新たな未来を想像させるプロトタイプ',
    color: 'pf-newhope',
  },
  {
    name: 'サステナブルアワード',
    description: '環境・社会・経済等の未来を考え、持続可能な社会につなげるプロトタイプ',
    color: 'pf-sustainable',
  },
  {
    name: 'トレンドアワード',
    description: 'これからの社会やくらしの変化を先取りし、未来の可能性を感じさせるプロトタイプ',
    color: 'pf-trend',
  },
]

/** 選べる色トークン。pf-* はプロトフェス本番アワード用 */
export const AWARD_COLORS = [
  'pf-yell',
  'pf-smile',
  'pf-backstory',
  'pf-hirameki',
  'pf-heartcatch',
  'pf-newhope',
  'pf-sustainable',
  'pf-trend',
  'pink',
  'purple',
  'green',
  'yellow',
  'orange',
  'cyan',
  'deep-pink',
  'gray',
] as const

/**
 * 入力行のうち、名前が空でなく、既存にも入力内の先行行にも無いものだけを作成対象にする。
 * 名前の一致で突き合わせるので、何度押しても二重登録しない。
 */
export function planCreations<T extends { name: string }>(
  rows: readonly T[],
  existingNames: Iterable<string>,
): { toCreate: T[]; skipped: T[] } {
  const seen = new Set(Array.from(existingNames, (n) => n.trim()))
  const toCreate: T[] = []
  const skipped: T[] = []
  for (const row of rows) {
    const name = row.name.trim()
    if (!name) continue
    if (seen.has(name)) {
      skipped.push(row)
      continue
    }
    seen.add(name)
    toCreate.push({ ...row, name })
  }
  return { toCreate, skipped }
}
