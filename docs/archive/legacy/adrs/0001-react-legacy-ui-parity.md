# ADR 0001: React リプレイスで旧 Vue UI を正とする

- **日付:** 2026-05-13  
- **ステータス:** 採用  

## 状況

`docs/designs/frontend.md` は CSS Modules 中心の新構成を前提としていた一方、プロダクト要件として **見た目・導線を旧 Vue（プロトフェス）に合わせる** 優先度が高い。

## 決定

- React + TypeScript への移行は進めるが、**スタイリングと画面構成の正は旧 Vue** とする。
- Bootstrap + SCSS（`legacy-*.scss`）で再現し、ルート定義も旧 `router/index.js` に合わせる。

## 結果

- 設計ドキュメント `frontend.md` は将来の整理用として残し、差分は `designs/README.md` の「実装コードとの関係」および本 ADR で説明する。

## 代替案（却下理由）

- 設計ドキュメントどおり CSS Modules で一新: リプレイス範囲と工数が増え、イベント運営上のリスクが大きい。
