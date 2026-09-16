# テスト実行記録 — 2026-09-05（事前アンケート導線と公開ゲートの合格基準 #91）

## 何を

### 対象（src）

- `src/features/entry/`（`EntryPage` / `resolveEntryStep` / `SurveyStep` / `WaitingStep`）
- `src/shared/access/RequireAppOpen.tsx` / `src/shared/hooks/useAppAccess.ts` / `src/router/index.tsx`

### テストコード（tests）

- 既存: `tests/unit/app-access-gate-scope.test.ts` `resolve-entry-step.test.ts` `use-app-access.test.ts` `presurvey-api.test.ts` `waiting-step-schedule.test.ts`（追加・変更なし）

## なぜ

issue #91。`docs/specs/pre-survey/README.md` の合格基準10項目と `docs/specs/app-access-gate-scope/README.md` のテスト項目T-1〜T-8（issueの表記ではG-1〜G-8）が未検証のまま `- [ ]` で残っていた。

## 実行コマンド

本記録の作成環境は git worktree のみで、`node_modules` が存在せず、docker・ローカル起動中のserver・実ブラウザ環境が無い（この記録の作成時点ではビルド・テスト実行を行っていない）。そのため以下のうち実際に実行できたのはA（静的検査）のみで、B（`npm`/`vitest`）とC（curl・Playwright MCP・SQL）は**未実行**。

**A. 実行した静的検査（このworktree内で完結）**

```bash
git grep -n "presurveyLocalStore\|presurveySessionStore\|config/questions" HEAD -- src
# => 該当なし（exit 1）

git show HEAD:src/router/index.tsx | sed -n '84,114p'
# => participant-gated:start〜end の1ブロックに RequireAuth><RequireAppOpen> 経由で
#    /home /checkin /award-vote /schedule /booth-list /venue-map
#    /gachapon /gachapon/use /gachapon/complete /qa の10ルートが並んでいることを確認

grep -n "describe(\|it(" tests/unit/app-access-gate-scope.test.ts tests/unit/resolve-entry-step.test.ts \
  tests/unit/use-app-access.test.ts tests/unit/presurvey-api.test.ts tests/unit/waiting-step-schedule.test.ts
# => F11のとおり5ファイルとも存在し、該当するdescribe/itケースがあることを確認（内容の読解のみ。実行はしていない）
```

**B. 未実行（node_modulesが無いため）**

```bash
npm --prefix tests run test
npx --prefix tests vitest run unit/app-access-gate-scope.test.ts unit/resolve-entry-step.test.ts \
  unit/use-app-access.test.ts unit/presurvey-api.test.ts unit/waiting-step-schedule.test.ts --reporter=verbose
```

**C. 未実行（ローカルserver・実ブラウザ・DBが無いため）**

```bash
curl -s http://localhost:3000/api/v1/events/<EVENT_ID>/pre-survey/questions | jq '.data.questions | length'
curl -s http://localhost:3000/api/v1/events/<EVENT_ID>/pre-survey/questions \
  | jq '.data.questions[] | select(.question_key=="interest_categories") | .options'
# Playwright MCP: browser_navigate / browser_snapshot / browser_evaluate（10パス分 + 送信フロー）
# server ローカルDB:
SELECT user_id, event_id, age_range, occupation,
       JSON_EXTRACT(custom_answers, '$.interest_categories') AS interest_categories,
       updated_at
FROM user_survey_answers
WHERE user_id = '<TEST_USER_ID>';
```

## 環境

- ブランチ: `docs/pre-survey-verification`（worktreeのbaseは `origin/develop` = `eabc29a`）
- データソース: なし（ローカルserver・DBを起動していないため未接続。設計書の想定は `api`）
- 関連 PR / Issue: #91, #76（依存・develop実装済み）

## 結果

| 項目 | 判定 | 証拠 |
|---|---|---|
| T-1 未ログインで設問を表示できる | 未実施（環境制約：ローカルserver未起動のためcurl不可） | — |
| T-2 回答送信後 `/thanks` へ遷移する（読み替え: WaitingStepになる） | 未実施（環境制約：実ブラウザ/Playwright MCP対象アプリなし）。文言修正は§8-1により三上くん確認待ちで保留 | — |
| T-3 `is_open: false` のときボタン無効・カウントダウン表示 | 未実施（環境制約：organizer操作対象のローカルserverなし） | — |
| T-4 `is_open` がtrueに変わると再読込なしでボタン有効 | 未実施（環境制約：同上、30秒ポーリングの実機待ちも不可） | — |
| T-5 端末時計をずらしてもサーバー時刻に追随する | 未実施（単体テスト・実機とも未実施。単体は`node_modules`なしで実行不可、実機は#95リハーサル待ち） | — |
| T-6 締切後の送信で409を受け、その旨が表示される | 未実施（環境制約：単体テスト未実行・Playwright未実施） | — |
| T-7 必須設問が未回答だと送信できない | 未実施（環境制約：実ブラウザ・DB `SELECT` とも未実施） | — |
| T-8 関心分野の選択肢がサーバーから来た値である | 未実施（環境制約：`/admin/categories`操作・curl不可。参考: `git grep -n "興味\|関心分野\|category" HEAD -- src/features/entry` は0件で、分野名のハードコードは見当たらなかった） | grep出力（参考） |
| T-9 `presurveyLocalStore` / `presurveySessionStore` / `config/questions.ts` が存在しない | **合格** | `git grep -n "presurveyLocalStore\|presurveySessionStore\|config/questions" HEAD -- src` → 該当なし（exit 1） |
| T-10 `/thanks` の遷移先がゲートの`is_open`に従う（読み替え: waiting/onboarding分岐） | 未実施（単体`resolve-entry-step.test.ts`実行不可のため。ソース読解では`resolveEntryStep`が`isOpen`で`waiting`/`onboarding`を分岐することを確認済みだが、テスト実行による確証ではない） | ソース抜粋（`resolveEntryStep.ts:56-57`） |
| G-1 `is_open=false`で「ゲートを追加」の全パスが開放待ちになる | 未実施（環境制約：Playwright MCPの接続先アプリなし） | — |
| G-2 `is_open=false`でも`/e/:eventId`が開き回答できる | 未実施（環境制約：実ブラウザ・DB `SELECT`とも未実施） | — |
| G-3 `is_open=false`でも`/verify-email`が動く | 未実施（環境制約：同上） | — |
| G-4 `is_open=true`で全画面が従来どおり開く | 未実施（環境制約：同上） | — |
| G-5 未認証で`/qa`を開くと入口へリダイレクトされる | 未実施（環境制約：同上） | — |
| G-6 出展者・運営の画面はゲートの影響を受けない | 未実施（環境制約：同上） | — |
| G-7 開放待ち画面に開放予定時刻が出る | 未実施（T-3と同一証拠。環境制約により同上） | — |
| G-8 参加者ルートを1つ足すと自動でゲート配下に入る | 未実施（単体`app-access-gate-scope.test.ts`実行不可のため。構造上の証拠のみ静的に確認済み） | `git show HEAD:src/router/index.tsx \| sed -n '84,114p'`（`participant-gated:start`〜`end`の1ブロックに`RequireAuth><RequireAppOpen>`経由で10ルートが並ぶことを確認） |

**18行（T-1〜T-10、G-1〜G-8）。合格1件（T-9）、残り17件は未実施。**

## メモ

- **環境制約により、本記録は設計書§7が想定するライブ検証（docker起動・`npm run dev`・organizer操作・Playwright MCPでの実ブラウザ操作・server DBへの`SELECT`・`npm`/`vitest`実行）をほぼ実施できていない。** 本worktreeは docs-only PR 用に `node_modules` を持たず、ローカルserver/DB/ブラウザにも接続していない。実際に実行・確認できたのは静的検査（`git grep` / `git show` / ソースコード読解）のみで、それで合否判定できたのはT-9のみ。
- 上記のため、README（`docs/specs/pre-survey/README.md` は T-9 のみ `[x]`、`docs/specs/app-access-gate-scope/README.md` は変更なし）は設計書§6の完了条件（前者≥8件、後者≥7件）を満たしていない。証拠のない項目にチェックを入れないという設計書§5の禁止事項を優先した結果。
- T-2/T-10の文言修正（`/thanks`→開放待ち画面への読み替え）は設計書§8-1により「返答前でも検証は進め、README の文言修正だけ返答待ちにする」とされているため、この記録では検証（未実施のまま）にとどめ、READMEの文言（`docs/specs/pre-survey/README.md` 48/62/70行）は書き換えていない。**三上くんの確認: 未**。
- T-5（実機・端末時計ずらし）は設計書どおり#95リハーサル送り。加えて単体テスト側（`use-app-access.test.ts`）も本環境では未実行。
- 別issue: 該当なし（不合格と判定した項目はない。全て未実施のため、README側の不合格系チェックも発生していない）。
