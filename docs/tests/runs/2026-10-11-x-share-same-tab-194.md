# テスト実行記録 — 2026-10-11（X 共有をモバイルでは同じタブで開く #194）

## 何を

### 対象（src）

- `src/shared/lib/xShare.ts`（`openXShare`）

### テストコード（tests）

- `tests/unit/share-post-template.test.ts`（`openXShare` の分岐 3 ケースを追加）

## なぜ

モバイルで共有するたびに `about:blank` のタブが残るため（issue #194）。

## 実行コマンド

```bash
npm test
npm run lint
npx tsc -b
```

## 環境

- ブランチ: `fix/x-share-same-tab-194`
- 関連 Issue: #194

## 結果

- 自動テスト: iOS / Android は `location.href` に代入され `window.open` を呼ばない。PC は `window.open(..., '_blank', 'noopener,noreferrer')` で `location` は変わらない
- 実機確認（起票者）: iPhone Safari・Android Chrome で空タブが増えないこと／X アプリ未導入端末で x.com が開き「戻る」で戻れること／戻ったときホームの状態が保たれること

## メモ

`BeforeLeavingPage.tsx` のアンケートリンクは対象外（新規タブのまま）。
