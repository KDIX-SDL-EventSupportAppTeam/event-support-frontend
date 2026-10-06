/**
 * プロトフェス用の初期データ（ブース39件・カテゴリ6件）。
 * 推薦（booths.category_id を1つだけ読む）とビンゴ外周割当が偏らないよう、
 * 1ブース1カテゴリ・各カテゴリ6〜7件にそろえてある。
 * 21 テトラスペース・37 LINEヤフーは説明が未定のため社名から推測して分類している。
 */

export const PROTOFES_CATEGORIES = [
  '遊び・ゲーム',
  'テクノロジー・AI・XR',
  '健康・からだ・睡眠',
  '暮らし・ペット・ファッション',
  'ものづくり・アート・デザイン',
  '防災・環境・サステナブル',
] as const

export type ProtofesCategory = (typeof PROTOFES_CATEGORIES)[number]

export type ProtofesBooth = {
  display_code: string
  name: string
  description: string
  category: ProtofesCategory
}

export const PROTOFES_BOOTHS: ProtofesBooth[] = [
  { display_code: '1', name: '近畿大学 須藤ゼミ', description: '回りたくなる「PRoToFES BINGO」', category: '遊び・ゲーム' },
  { display_code: '2', name: 'エモリアル', description: '「とびだす名刺AR」', category: 'テクノロジー・AI・XR' },
  { display_code: '3', name: '株式会社オカムラ', description: '記憶と感情を奏でる「ジェスチャーオーケストラ」', category: 'テクノロジー・AI・XR' },
  { display_code: '4', name: '近畿大学 寺本ゼミ', description: '悪い姿勢をシャキッと正す「姿勢シャキッT」', category: '健康・からだ・睡眠' },
  { display_code: '5', name: '株式会社ヤマサン×布施ゼミ', description: '自由に動く、ホンモノみたいな「アニ・パル®」', category: '暮らし・ペット・ファッション' },
  { display_code: '6', name: '日高アクリル工芸(株)', description: 'うちの子アクリルアート「COCO」', category: 'ものづくり・アート・デザイン' },
  { display_code: '7', name: 'Open Creation Lab.', description: 'AIと遊ぼう「Kids AI Workshop」', category: 'テクノロジー・AI・XR' },
  { display_code: '8', name: '株式会社ウラノ×布施ゼミ', description: 'ジオデシックドームがちゃゴーランド「FAVEホイール」', category: '遊び・ゲーム' },
  { display_code: '9', name: '株式会社oneA', description: 'いびき対策スマートデバイス「Sleeim」', category: '健康・からだ・睡眠' },
  { display_code: '10', name: 'システムデザイン論研究室', description: '噛むと音が変わる不思議な食体験「噛ミング♪」', category: '健康・からだ・睡眠' },
  { display_code: '11', name: 'SkinNotes', description: 'アトピー患者のかゆみ軽減を目指す緑茶染めインナー', category: '健康・からだ・睡眠' },
  { display_code: '12', name: '近畿大学 寺本ゼミ', description: '誰でも遊べる触覚カードゲーム「さわりあ」', category: '遊び・ゲーム' },
  { display_code: '13', name: '牛乳石鹸共進社(株)', description: '服を着たまま洗髪できる「SUSUGU」', category: '健康・からだ・睡眠' },
  { display_code: '14', name: '近畿大学 寺本ゼミ', description: 'アレルギー双六', category: '遊び・ゲーム' },
  { display_code: '15', name: '株式会社SDAT×仙波ゼミ', description: '私だけの隠れ家。「Serenity」', category: '暮らし・ペット・ファッション' },
  { display_code: '16', name: '株式会社SDAT×布施ゼミ', description: 'アルミ製の新感覚ペットドーム「ひやぽかドーム」', category: '暮らし・ペット・ファッション' },
  { display_code: '17', name: '錦城護謨株式会社×仙波ゼミ&布施ゼミ', description: 'ゴムの可能性は無限大「造花&金魚すくいセット」', category: '遊び・ゲーム' },
  { display_code: '18', name: '錦城護謨株式会社×松本研究室', description: '親子の思いを結ぶ「護結」', category: '暮らし・ペット・ファッション' },
  { display_code: '19', name: '株式会社V&A Japan×山縣ゼミ', description: 'Tシャツから未来を変える「山縣ゼミTシャツ」', category: '防災・環境・サステナブル' },
  { display_code: '20', name: '株式会社V&A Japan×山縣ゼミ', description: 'カップの蓋が土に還る！「土に還る蓋」', category: '防災・環境・サステナブル' },
  { display_code: '21', name: 'テトラスペース', description: 'Coming soon', category: 'ものづくり・アート・デザイン' },
  { display_code: '22', name: 'クラスターテクノロジー(株)×布施ゼミ', description: '頑張る就活生に寄り添う、「就活コーム」', category: '暮らし・ペット・ファッション' },
  { display_code: '23', name: '須藤・川田ゼミ', description: 'ゲームで考えるロボットとの未来', category: '遊び・ゲーム' },
  { display_code: '24', name: 'Boo Boo Factory(株)', description: '水中をルアーの視点から。「カメラ内蔵ルアー」', category: 'テクノロジー・AI・XR' },
  { display_code: '25', name: '信川研×後藤ゼミ×情報学部', description: '宇宙の大きさを感じるカードゲーム「Novaデス」', category: '遊び・ゲーム' },
  { display_code: '26', name: 'カガミノハコ合同会社×古殿ゼミ', description: 'MakeBox', category: 'ものづくり・アート・デザイン' },
  { display_code: '27', name: '近畿大学 寺本ゼミ', description: '理想の休養を探すDr.オヤスミの本音クリニック', category: '健康・からだ・睡眠' },
  { display_code: '28', name: 'TREVAN', description: '新感覚のVRプロジェクター技術「ポータルミート」', category: 'テクノロジー・AI・XR' },
  { display_code: '29', name: '近畿大学 寺本ゼミ', description: 'そなえるあそべる防災リュック「ASOBOSAI!」', category: '防災・環境・サステナブル' },
  { display_code: '30', name: '大阪市立デザイン教育研究所×Sゼミ', description: '触って考える、新しい操作のプロトタイプ', category: 'ものづくり・アート・デザイン' },
  { display_code: '31', name: '株式会社美販', description: 'ダンボールのベースボールキャップ「ダンボーシ」', category: '防災・環境・サステナブル' },
  { display_code: '32', name: '株式会社Askalカバン工房×松本研究室', description: '旅する思い出のラゲッジタグ「Brain Sphere」', category: '暮らし・ペット・ファッション' },
  { display_code: '33', name: '株式会社f-pzl', description: 'フェルトで描くドット絵「エフパズルmini」正方形が球へ', category: 'ものづくり・アート・デザイン' },
  { display_code: '34', name: '株式会社菱屋×アイザック', description: '初心者向けＣＡＤアプリ「ビギナーCAD（仮名）」', category: 'ものづくり・アート・デザイン' },
  { display_code: '35', name: '近畿大学 寺本ゼミ', description: 'こうやって使ったらええんちゃう？知らんけど。', category: '暮らし・ペット・ファッション' },
  { display_code: '36', name: '株式会社Eikyu×布施ゼミ', description: '殺虫剤・忌避剤を使わない虫よけグッズ「おにやんま君®」', category: '防災・環境・サステナブル' },
  { display_code: '37', name: 'ＬＩＮＥヤフー', description: 'Coming soon', category: 'テクノロジー・AI・XR' },
  { display_code: '38', name: '若井ホールディングス(株)×プロダクトデザイン・空間デザインゼミ', description: '「ラビゲン」を活用した壁面デザインワークショップ', category: 'ものづくり・アート・デザイン' },
  { display_code: '39', name: '株式会社NINZIA', description: 'NINZIA BOSAIカレー', category: '防災・環境・サステナブル' },
]
