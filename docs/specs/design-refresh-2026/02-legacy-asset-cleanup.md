---
状態: 確定
最終更新: 2026-08-26
---

# 前年素材の参照解消とファビコン

作業ブランチ: `fix/design/legacy-asset-paths`

## 何が起きているか

2026 年版素材の配置にあわせて前年の素材を `public/legacy/` へ移した（コミット `bc68e2b`）。
**コード側の参照パスが未追従で、現在 9 箇所が画像リンク切れである。**

行番号は 2026-08-26 時点。ずれていたらパス文字列で検索すること。

```bash
grep -rn "/icons/\|/logo_main\.png\|/logo\.png" src
```

## 差し替え表

**この PR ですべて 2026 年版へ差し替える。** `legacy/` 参照は 1 つも残さない。

| 参照元 | 変更前 | 変更後 |
|---|---|---|
| `HomePage.tsx:173` | `/icons/gacha1.png` | `/gacha/coin.png` |
| `HomePage.tsx:175` | `/icons/gacha2.png` | `/gacha/coin.png` |
| `GachaponUsePage.tsx:63` | `/icons/coin-gold.png` | `/gacha/coin.png` |
| `GachaponCompletePage.tsx:8` | `/logo_main.png` | `/brand/logo-protofes.png` |
| `CheckInPage.tsx:256` | `/icons/success.png` | `/mascot/mascot-cheering.png` |
| `HomePage.tsx:186` | `/icons/map.png` | **不要**（下記） |
| `HomePage.tsx:198` | `/icons/qr-code-scan.png` | **不要** |
| `HomePage.tsx:210` | `/icons/time-table.png` | **不要** |
| `HomePage.tsx:222` | `/icons/trophy.png` | **不要** |

**コインは大小を分けず `/gacha/coin.png` を共用する。** 表示サイズは CSS で調整する。

`/icons/map.png` 以下 4 件は `HomePage` のボタングリッドにあり、
[03-bottom-navigation.md](03-bottom-navigation.md) で**ボタンごと削除される。**

```
  この PR                          次の PR (03)
  ─────────                        ─────────────
  4件は /legacy/ 付きで一旦復旧  →  ボタンごと削除
```

**この PR では 4 件も `/legacy/icons/...` に直してリンク切れを解消しておく。**
「次で消すから」と壊れたまま放置しない。中間状態でも動く状態を保つ。

`GachaponCompletePage.tsx` のロゴは `maxWidth: 150` のインラインスタイルが付いている。
`logo-protofes.png` は横長なので、**表示を確認して必要なら調整する。**

## ファビコン

現在ファビコンが出ていない（`legacy/favicon.ico` へ退避したため）。

**`/mascot/mascot-cheering.png` から生成する。**

1. `public/mascot/mascot-cheering.png`（1254×1254）から正方形に切り出す
2. `public/favicon.png`（512×512 程度）として書き出す
3. `index.html` の `<head>` に明示的に書く

```html
<link rel="icon" type="image/png" href="/favicon.png" />
```

**Vite の暗黙の `/favicon.ico` 拾いに頼らない。** 明示的に書くこと。
`.ico` 形式にする必要はない。現行ブラウザは PNG のファビコンを解釈する。

キャラクターは背景透過なので、**タブが暗色テーマのとき輪郭が見えるか確認すること。**
見えなければ `--pf-cream` 相当の下地を敷いて書き出す。

## 完了の条件

- `grep -rn "/icons/\|/logo_main\|/logo\.png" src` の結果が、
  `HomePage` のボタングリッド 4 件（`/legacy/` 付き）だけになっている
- 参加者画面を一通り開いて**画像が欠けていない**
- ブラウザのタブにファビコンが出る
- `npm run test` と `npm run build` が通る
