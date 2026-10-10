# テスト実行記録 — 2026-10-11（QR 読み取り画面の映像が枠の一部にしか映らない #192）

## 何を

### 対象（src）

- `src/shared/styles/legacy-participant-pages.scss`（`video` の幅・高さを `!important` で 100%、`.checkin-qr-reader-guide` を追加）
- `src/features/checkin/pages/CheckInQrScanView.tsx`（`qrbox` を外し、目安枠を兄弟要素で `running` のみ表示）
- `src/features/checkin/lib/cameraConstraints.ts`（`qrboxSize` / `QRBOX_RATIO` を削除）

### テストコード（tests）

- `tests/unit/classify-camera-error.test.ts`（`qrboxSize` のテストを削除。`qrbox` 不使用・枠の置き方・CSS の静的確認を追加）

## なぜ

html5-qrcode が起動時の寸法をピクセルで固定し、iOS の映像寸法の変化とずれるため（issue #192）。

## 実行コマンド

```bash
npm test
npm run lint
npx tsc -b
```

## 環境

- ブランチ: `fix/qr-reader-fill-192`
- 関連 Issue: #192

## 結果

- 自動テストはソースの静的確認のみ（見た目・カメラは自動化しない: `docs/rules/testing.md`）

## メモ（実機確認項目）

- iPhone Safari: 映像が黒い正方形いっぱいに出る／目安枠が正方形で中央にある
- Android Chrome で崩れない
- 枠の中央に QR を写して読み取れる。ZXing フォールバックの端末で読み取りが遅くならない
- 起動中の「カメラを起動しています…」が従来どおり出る
- `qrbox` を外したため、cover でトリミングされた範囲の QR も読み得る（実害は無い想定）
