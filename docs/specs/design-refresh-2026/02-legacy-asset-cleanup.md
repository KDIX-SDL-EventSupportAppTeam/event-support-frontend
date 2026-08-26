---
状態: 草案
最終更新: 2026-08-26
---

# legacy 退避で壊れた参照の解消

作業ブランチ: `fix/design/legacy-asset-paths`

## 何が起きているか

2026 年版素材の配置にあわせて、前年の素材を `public/legacy/` へ移した
（コミット `bc68e2b`）。**コード側の参照パスが未追従で、現在 9 箇所が画像リンク切れである。**

| 参照元 | 現在のパス | 実体の場所 |
|---|---|---|
| `src/features/checkin/pages/CheckInPage.tsx:256` | `/icons/success.png` | `public/legacy/icons/success.png` |
| `src/features/gachapon/pages/GachaponCompletePage.tsx:8` | `/logo_main.png` | `public/legacy/logo_main.png` |
| `src/features/gachapon/pages/GachaponUsePage.tsx:63` | `/icons/coin-gold.png` | `public/legacy/icons/coin-gold.png` |
| `src/features/home/pages/HomePage/HomePage.tsx:173` | `/icons/gacha1.png` | `public/legacy/icons/gacha1.png` |
| `src/features/home/pages/HomePage/HomePage.tsx:175` | `/icons/gacha2.png` | `public/legacy/icons/gacha2.png` |
| `src/features/home/pages/HomePage/HomePage.tsx:186` | `/icons/map.png` | `public/legacy/icons/map.png` |
| `src/features/home/pages/HomePage/HomePage.tsx:198` | `/icons/qr-code-scan.png` | `public/legacy/icons/qr-code-scan.png` |
| `src/features/home/pages/HomePage/HomePage.tsx:210` | `/icons/time-table.png` | `public/legacy/icons/time-table.png` |
| `src/features/home/pages/HomePage/HomePage.tsx:222` | `/icons/trophy.png` | `public/legacy/icons/trophy.png` |

行番号は 2026-08-26 時点。ずれていたらパス文字列で検索すること。

```bash
grep -rn "/icons/\|/logo_main\.png\|/logo\.png" src
```

## この PR でやること

**`/legacy/` を前置して表示を復旧させるだけ。** 2026 年版素材への差し替えはしない。

```tsx
<img src="/icons/trophy.png" ... />          // 変更前
<img src="/legacy/icons/trophy.png" ... />   // 変更後
```

## なぜ差し替えないのか

- `HomePage` のボタングリッド（`/icons/map.png` 等 4 箇所）は
  [03-bottom-navigation.md](03-bottom-navigation.md) で**ボタンごと消える。**
  今差し替えても捨てる作業になる
- `gacha1.png` / `gacha2.png` / `success.png` は 2026 年版に**明確な後継が無い**（下記）

**まずリンク切れという明確なバグだけを潰す。** これは小さく安全で、他の作業を待たせない。

## 後継が無い素材（要判断）

差し替え先が決まっていないもの。**この PR では触らず、`legacy/` 参照のまま残す。**

| 前年素材 | 使用箇所 | 状況 |
|---|---|---|
| `icons/gacha1.png` / `gacha2.png` | ホームのガチャポンボタン左右 | 2026 年版に対応素材なし。そもそもガチャは準備中 |
| `icons/success.png` | チェックイン完了表示 | `feedback/` のポップアップ素材で代替できるか要検討 |
| `logo_main.png` | ガチャ完了画面 | `brand/logo-protofes.png` で置き換えられそうだが、縦横比が違う |

`logo_main.png` → `brand/logo-protofes.png` の差し替えは有力だが、
`maxWidth: 150` のインラインスタイルと合うか実機で見ないと判断できない。**勝手に決めない。**

## favicon について

`public/legacy/favicon.ico` は `index.html` から参照されていない
（`index.html` に `<link rel="icon">` が無く、Vite の既定で `/favicon.ico` が拾われていた）。
`legacy/` へ移したことで**現在ファビコンは出ていない。**

2026 年版のファビコン素材は受領していない。
**要判断**：`brand/logo-protofes.png` から起こすか、アート担当へ追加依頼するか。
この PR の範囲外とし、決まるまで放置してよい。

## 完了の条件

- 上の表 9 箇所が `/legacy/` 付きに直っている
- 参加者画面を一通り開いて**画像が欠けていない**
- `npm run test` と `npm run build` が通る
