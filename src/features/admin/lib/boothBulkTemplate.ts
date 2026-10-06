/**
 * ブース一括登録画面の「テンプレートを読み込む」ボタンで流し込む初期データ。
 *
 * 出どころ: 2026-09-29 受領のフロアマップ・ポスター画像（39ブース分の番号・出展者名・
 * 紹介文）。ジャンル（カテゴリ）はポスターに書かれていないため空欄にしてあり、
 * 運営が「少しの修正」で埋める前提（21・37は紹介文が「Coming soon」のまま未確定）。
 *
 * ここは表示用の初期値を持っているだけで、正本はあくまで運営が一括作成ボタンで
 * 送信した後のサーバー側データ（AGENTS.md「フロントで計算しない」）。
 */
export type BoothBulkTemplateRow = {
  displayCode: string
  name: string
  description: string
}

export const BOOTH_BULK_TEMPLATE: readonly BoothBulkTemplateRow[] = [
  { displayCode: '1', name: '近畿大学 須藤ゼミ', description: '回りたくなる「PRoToFES BINGO」' },
  { displayCode: '2', name: 'エモリアル', description: '「とびだす名刺AR」' },
  { displayCode: '3', name: '株式会社オカムラ', description: '記憶と感情を奏でる「ジェスチャーオーケストラ」' },
  { displayCode: '4', name: '近畿大学 寺本ゼミ', description: '悪い姿勢をシャキッと正す「姿勢シャキッT」' },
  { displayCode: '5', name: '株式会社ヤマサン×布施ゼミ', description: '自由に動く、ホンモノみたいな「アニ・パル®」' },
  { displayCode: '6', name: '日高アクリル工芸(株)', description: 'うちの子アクリルアート「COCO」' },
  { displayCode: '7', name: 'Open Creation Lab.', description: 'AIと遊ぼう「Kids AI Workshop」' },
  { displayCode: '8', name: '株式会社ウラノ×布施ゼミ', description: 'ジオデシックドームがちゃゴーランド「FAVEホイール」' },
  { displayCode: '9', name: '株式会社oneA', description: 'いびき対策スマートデバイス「Sleeim」' },
  { displayCode: '10', name: 'システムデザイン論研究室', description: '噛むと音が変わる不思議な食体験「噛ミング♪」' },
  { displayCode: '11', name: 'SkinNotes', description: 'アトピー患者のかゆみ軽減を目指す緑茶染めインナー' },
  { displayCode: '12', name: '近畿大学 寺本ゼミ', description: '誰でも遊べる触覚カードゲーム「さわりあ」' },
  { displayCode: '13', name: '牛乳石鹸共進社(株)', description: '服を着たまま洗髪できる「SUSUGU」' },
  { displayCode: '14', name: '近畿大学 寺本ゼミ', description: 'アレルギー双六' },
  { displayCode: '15', name: '株式会社SDAT×仙波ゼミ', description: '私だけの隠れ家。「Serenity」' },
  { displayCode: '16', name: '株式会社SDAT×布施ゼミ', description: 'アルミ製の新感覚ペットドーム「ひやぽかドーム」' },
  { displayCode: '17', name: '錦城護謨株式会社×仙波ゼミ&布施ゼミ', description: 'ゴムの可能性は無限大「造花&金魚すくいセット」' },
  { displayCode: '18', name: '錦城護謨株式会社×松本研究室', description: '親子の思いを結ぶ「護結」' },
  { displayCode: '19', name: '株式会社V&A Japan×山縣ゼミ', description: 'Tシャツから未来を変える「山縣ゼミTシャツ」' },
  { displayCode: '20', name: '株式会社V&A Japan×山縣ゼミ', description: 'カップの蓋が土に還る！「土に還る蓋」' },
  { displayCode: '21', name: 'テトラスペース', description: 'Coming soon' },
  { displayCode: '22', name: 'クラスターテクノロジー(株)×布施ゼミ', description: '頑張る就活生に寄り添う、「就活コーム」' },
  { displayCode: '23', name: '須藤・川田ゼミ', description: 'ゲームで考えるロボットとの未来' },
  { displayCode: '24', name: 'Boo Boo Factory(株)', description: '水中をルアーの視点から。「カメラ内蔵ルアー」' },
  { displayCode: '25', name: '信川研×後藤ゼミ×情報学部', description: '宇宙の大きさを感じるカードゲーム「Novaデス」' },
  { displayCode: '26', name: 'カガミノハコ合同会社×古殿ゼミ', description: 'MakeBox' },
  { displayCode: '27', name: '近畿大学 寺本ゼミ', description: '理想の休養を探すDr.オヤスミの本音クリニック' },
  { displayCode: '28', name: 'TREVAN', description: '新感覚のVRプロジェクター技術「ポータルミート」' },
  { displayCode: '29', name: '近畿大学 寺本ゼミ', description: 'そなえるあそべる防災リュック「ASOBOSAI!」' },
  { displayCode: '30', name: '大阪市立デザイン教育研究所×Sゼミ', description: '触って考える、新しい操作のプロトタイプ' },
  { displayCode: '31', name: '株式会社美販', description: 'ダンボールのベースボールキャップ「ダンボーシ」' },
  { displayCode: '32', name: '株式会社Askalカバン工房×松本研究室', description: '旅する思い出のラゲッジタグ「Brain Sphere」' },
  { displayCode: '33', name: '株式会社f-pzl', description: 'フェルトで描くドット絵「エフパズルmini」正方形が球へ' },
  { displayCode: '34', name: '株式会社菱屋×アイザック', description: '初心者向けＣＡＤアプリ「ビギナーCAD（仮名）」' },
  { displayCode: '35', name: '近畿大学 寺本ゼミ', description: 'こうやって使ったらええんちゃう？知らんけど。' },
  { displayCode: '36', name: '株式会社Eikyu×布施ゼミ', description: '殺虫剤・忌避剤を使わない虫よけグッズ「おにやんま君®」' },
  { displayCode: '37', name: 'ＬＩＮＥヤフー', description: 'Coming soon' },
  {
    displayCode: '38',
    name: '若井ホールディングス(株)×プロダクトデザイン・空間デザインゼミ',
    description: '「ラビゲン」を活用した壁面デザインワークショップ',
  },
  { displayCode: '39', name: '株式会社NINZIA', description: 'NINZIA BOSAIカレー' },
]
