import type { PreSurveyQuestion } from '@/features/presurvey/types/presurvey'

/**
 * 事前アンケートの質問定義。
 *
 * ラフ集合分析の決定表に載る「条件属性」を離散値で集める。
 * 質問の追加・変更はこのファイルだけで済むようにしておき、
 * 画面（PreSurveyFormPage）は定義を読んで描画するだけにする。
 *
 * NOTE: 将来サーバーから質問定義を配信する場合は、この配列を
 * `fetchPreSurveyQuestions()`（api/presurveyApi.ts）の戻り値に差し替える。
 */
export const PRE_SURVEY_QUESTIONS: PreSurveyQuestion[] = [
  {
    id: 'age_group',
    label: '年代',
    type: 'single',
    required: true,
    choices: [
      { value: 'teens', label: '10代' },
      { value: 'twenties', label: '20代' },
      { value: 'thirties', label: '30代' },
      { value: 'forties', label: '40代' },
      { value: 'fifties_plus', label: '50代以上' },
    ],
  },
  {
    id: 'occupation',
    label: 'ご職業・所属',
    type: 'single',
    required: true,
    choices: [
      { value: 'student', label: '学生' },
      { value: 'engineer', label: 'エンジニア' },
      { value: 'designer', label: 'デザイナー' },
      { value: 'planner', label: '企画・営業' },
      { value: 'other', label: 'その他' },
    ],
  },
  {
    id: 'attend_count',
    label: '本イベントへの参加回数',
    type: 'single',
    required: true,
    choices: [
      { value: 'first', label: '初参加' },
      { value: 'few', label: '2〜3回目' },
      { value: 'many', label: '4回目以上' },
    ],
  },
  {
    id: 'purpose',
    label: '参加の主な目的',
    type: 'single',
    required: true,
    choices: [
      { value: 'research', label: '情報収集' },
      { value: 'networking', label: '交流・人脈づくり' },
      { value: 'recruiting', label: '採用・転職' },
      { value: 'support_exhibitor', label: '出展者の応援' },
      { value: 'other', label: 'その他' },
    ],
  },
  {
    id: 'interest_fields',
    label: '関心のある分野（複数選択可）',
    type: 'multi',
    required: true,
    choices: [
      { value: 'ai', label: 'AI・機械学習' },
      { value: 'web', label: 'Web・アプリ' },
      { value: 'hardware', label: 'ハードウェア・IoT' },
      { value: 'design', label: 'デザイン・UX' },
      { value: 'business', label: 'ビジネス・事業開発' },
    ],
  },
  {
    id: 'knowledge_level',
    label: '本イベントのテーマに関する知識レベル',
    type: 'single',
    required: true,
    choices: [
      { value: 'beginner', label: '初心者' },
      { value: 'intermediate', label: '中級者' },
      { value: 'advanced', label: '上級者' },
    ],
  },
  {
    id: 'motivation',
    label: '参加への期待度',
    type: 'single',
    required: true,
    choices: [
      { value: 'low', label: '低い' },
      { value: 'middle', label: 'ふつう' },
      { value: 'high', label: '高い' },
    ],
  },
  {
    id: 'free_comment',
    label: 'イベントへの期待・ご要望（任意）',
    type: 'text',
    required: false,
    help: '自由記述はラフ集合分析の対象外です（運営の参考情報として利用します）。',
  },
]
