# 作業指示: 事前アンケート（pre-survey）とアプリ公開ゲート（app access gate）

- **日付:** 2026-08-17
- **状態:** 草案（実装未着手）
- **対象リポジトリ:** `event-support-frontend` / `event-support-server` / DB（`db/create-tables.sql` + `db/migrations/`）
- **読み手:** 実装担当（別セッションの Claude Code / Cursor）。**本ファイルが仕様の正本**。

---

## 0. この文書の使い方

- 本文書は「事前アンケート」と「アプリ公開ゲート」の**フロント／サーバー／DB を貫く仕様**を定義する。
- 実装順は [§9 実装手順](#9-実装手順分割コミット単位) に従う。フロント単独で先に進めないこと（DB → サーバー → フロントの順）。
- 用語は [§2.5 用語](#25-用語ユビキタス言語への追加) を正とし、両リポジトリの `docs/ubiquitous-language.md` に追記してから実装に入る。
- **既に frontend に入っているモック実装**（`src/features/presurvey/`、localStorage 版）は本仕様の土台。差し替え範囲は [§7](#7-フロントエンド仕様) に明記する。

---

## 1. 背景

1. 事前アンケートは**イベント開催日の前日まで**に回答してもらう。回答はラフ集合分析（`event-support-analytics`）の条件属性として使う。
2. 一方、**アプリ本体はイベント開催直前まで開けたくない**。事前アンケートの完了画面に置いた「アプリに移動する」ボタンは、開催直前まで押せない状態にしておきたい。
3. 開放の判断は**主催者（`organizer` = 最高権限者）**が行う。運用上は「開催 30 分前に自動で開く」（タイマー）と「今すぐ開ける／閉じる」（手動）の両方が要る。当日の遅延・トラブルで前倒し／後ろ倒しが起きるため、**タイマーを手動で上書きできる**ことが必須。

## 2. 目的（Done の定義）

- 参加者が配布 URL から事前アンケートに回答し、完了画面に到達できる。
- 完了画面の「アプリに移動する」ボタンは、主催者が設定した**アプリ公開ゲート**の状態に従って有効／無効が切り替わる。無効時は開放予定時刻のカウントダウンを表示する。
- 主催者ポータルからゲートを「閉鎖 / 予約（時刻指定）/ 開放」の 3 モードで切り替えられ、変更が監査ログに残る。
- 事前アンケートは締切（既定: 開催日前日 23:59）を過ぎたら受け付けない。
- 回答データが `user_survey_answers` に入り、分析側が決定表として読める形になっている。

---

## 2.5. 用語（ユビキタス言語への追加）

両リポジトリの `docs/ubiquitous-language.md` に以下を追記する。

| 日本語 | コード上の名前 | 定義 |
|---|---|---|
| 事前アンケート | `pre_survey` | イベント開催前に参加者が回答するアンケート。回答はラフ集合分析の条件属性になる |
| 事前アンケート締切 | `pre_survey_closes_at` | 事前アンケートの回答受付終了日時。既定はイベント開催日の前日 23:59 |
| アプリ公開ゲート | `app_access` | 参加者がアプリ本体を使い始められるかを制御する、イベント単位のスイッチ |
| ゲートモード | `app_access.mode` | `closed`（閉鎖）/ `scheduled`（予約）/ `open`（開放）の 3 値 |
| 開放予定時刻 | `app_opens_at` | `scheduled` のときアプリが自動で開く日時 |
| 実効開放状態 | `is_open` | モード・時刻・現在時刻から算出した「今アプリを開けるか」の真偽値。サーバーが唯一の判定者 |

> 既存の「アンケート」（`survey_questions` / `user_survey_answers`、ログイン後に回答）と**同じデータ基盤を使う**。「事前アンケート」は*回答タイミングと導線*が違うだけであり、別テーブルは作らない（[§4 の決定 D-2](#4-設計判断決定事項)）。

---

## 3. 全体の画面遷移とタイミング

```
[前日まで]  参加者URL /pre-survey/:eventId
              ├ 初回        → /signup  参加者アカウント作成 → /form 回答入力 → /thanks
              └ 2回目以降   → /signin  サインイン
                                ├ 回答済み → /thanks
                                └ 未回答   → /form → /thanks

/thanks（回答ありがとうございました）
   └ [アプリに移動する] ボタン
        ├ is_open === true   → 有効。押すと /home（アプリ本体）へ
        └ is_open === false  → 無効（disabled）+ 「開放予定 8/20 09:30（あと 3 時間 12 分）」

[開催直前]  主催者が app_access を open にする、または app_opens_at 到達
              → /thanks を開いている参加者のボタンが自動で有効化される（ポーリング）
```

**主催者側**

```
主催者ポータル /organizer/events/:eventId
   └ 「アプリ公開」パネル
        ├ 現在の状態（実効開放状態・モード・開放予定時刻）
        ├ モード切替: 閉鎖 / 予約（日時入力）/ 開放
        ├ [今すぐ開放] [今すぐ閉鎖]（ワンクリックの手動上書き）
        └ 事前アンケート締切の設定
```

---

## 4. 設計判断（決定事項）

| ID | 判断 | 理由 |
|----|------|------|
| D-1 | 事前アンケートの**サインアップ／サインインは既存の参加者認証をそのまま使う**（`POST /auth/register` / `POST /auth/login`、`users` テーブル、role=`participant`） | 参加者アカウントを二重に持たせない。アンケート回答を `user_id` で一意に紐づけられる |
| D-2 | 回答は既存の `survey_questions` / `user_survey_answers` に保存。**新テーブルを作らない** | 分析側（`event-support-analytics`）の読み取り先を増やさない |
| D-3 | **ログインの可否とアプリ公開ゲートは分離する。** 事前アンケート期間中もログイン自体は可能で、ゲートは「アプリ本体の画面に入れるか」だけを制御する | アンケート回答にはログインが必要（D-1）。認証を止めると回答できない |
| D-4 | ゲートの**実効開放状態はサーバーが算出**して返す。クライアントの時計で判定しない | 端末時計のずれ・改変で早期入場されるのを防ぐ |
| D-5 | ゲート状態は**イベント単位**（`event_app_access` テーブル、events と 1:1） | イベントごとに開催時刻が違う。events テーブルへのカラム追加ではなく別テーブルにして、将来の拡張（区画別開放など）に備える |
| D-6 | ゲートの**書き込みは `organizer` のみ**。`manager` / `viewer` は読み取りのみ | 「運営の最高権限者が切り替える」という要件。運営スタッフの誤操作で早期公開されない |
| D-7 | `scheduled` は**保存された時刻とサーバー現在時刻の比較で判定する**。cron / ジョブは使わない | 単一インスタンス運用（server ADR 0002）でスケジューラを持たずに済む。時刻変更が即座に反映される |
| D-8 | 手動上書きは「モードを `open` / `closed` に変更する」ことで表現する。`scheduled` に戻せば予約が復活する | 状態が 3 モードに閉じ、UI と監査ログが単純になる |
| D-9 | フロントは**ゲート状態をポーリング**（30 秒間隔）+ 残り時間はローカルで秒カウント。WebSocket は使わない | 未ログイン〜ログイン直後の画面でも動く。socket は JWT 必須で `/thanks` に向かない |

### 4'. 実効開放状態の算出ルール（サーバー実装の唯一の定義）

```
is_open =
  mode === 'open'      → true
  mode === 'closed'    → false
  mode === 'scheduled' → app_opens_at !== null && now >= app_opens_at
                         && (app_closes_at === null || now < app_closes_at)
```

- `now` はサーバーの現在時刻（UTC 保存 / 比較。既存の `src/lib/datetime.ts` の扱いに合わせる）。
- `app_closes_at` は「イベント終了後に自動で閉じる」用の任意項目。未設定なら閉じない。
- レスポンスには `server_time` を必ず含める（クライアントは時計ずれ補正に使う）。

---

## 5. DB 仕様

### 5.1 新規テーブル `event_app_access`

`db/migrations/05_app_access_gate.sql` を新規作成し、同じ DDL を `db/create-tables.sql` にも反映する（テーブル数 **13 → 14**。ファイル冒頭のコメント・DROP セクション・確認手順の記述も更新すること）。

```sql
CREATE TABLE event_app_access (
  event_id             CHAR(36)     PRIMARY KEY,
  mode                 VARCHAR(20)  NOT NULL DEFAULT 'closed',
  app_opens_at         DATETIME     NULL,
  app_closes_at        DATETIME     NULL,
  pre_survey_closes_at DATETIME     NULL,
  updated_by           CHAR(36)     NULL,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (mode IN ('closed', 'scheduled', 'open')),
  FOREIGN KEY (event_id)   REFERENCES events(id)     ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES organizers(id) ON DELETE SET NULL
);
```

- `event_id` を主キーにして 1 イベント 1 行を保証する（events と 1:1）。
- 行が無いイベントは **`mode='closed'` 相当**として扱う（フォールバック。マイグレーション前に作られた既存イベントのため）。
- `updated_by` は変更した主催者。表示用途と監査の補助。

### 5.2 既定値の投入

- **イベント作成時**（`POST /organizer/events`）に 1 行を必ず作る。既定値:
  - `mode = 'scheduled'`
  - `app_opens_at = events.date_start - 30 分`
  - `pre_survey_closes_at = events.date_start の前日 23:59:59`（JST 基準で計算し保存形式に合わせる）
- マイグレーション時、既存イベントには上記と同じ規則で 1 行を backfill する（`INSERT ... SELECT` で可）。過去日程のイベントは結果的に `is_open = true` になるが、実運用上問題ない。

### 5.3 既存テーブルの扱い（事前アンケート側）

- `survey_questions`（`event_id`, `question_text`, `options` JSON, `display_order`, `is_required`）は**そのまま使う**。
- ラフ集合分析に必要な離散コードを保持するため、`options` JSON の要素は `{ "value": "twenties", "label": "20代" }` 形式に統一する。値が文字列だけの旧データは読み取り時に `{ value: s, label: s }` として扱う（サーバー側で正規化）。
- 回答形式（単一選択 / 複数選択 / 自由記述）を表現する必要がある。`survey_questions` に **`answer_type VARCHAR(20) NOT NULL DEFAULT 'single'`（`single` | `multi` | `text`）** を追加する（同じマイグレーション 05 に含める。`CHECK` 制約付き）。
- `user_survey_answers` は既存カラムを次のように使う。
  | カラム | 用途 |
  |---|---|
  | `age_range` | 年代の離散コード（例 `twenties`） |
  | `occupation` | 職業の離散コード（例 `engineer`） |
  | `industry` | 業種の離散コード（無ければ NULL） |
  | `custom_answers` | 上記以外すべて。`{ "<question_id>": "<value>" \| ["<value>", ...] }` |
  - `age_range` / `occupation` / `industry` は分析でよく使うため専用カラムに**併記**する（`custom_answers` にも同じ値を入れて良い）。どの質問をどのカラムに写すかは `survey_questions` 側の固定 `question_id`（`age_group` / `occupation` / `industry`）で判定する。
- **1 参加者 1 回答**を保証する。`user_survey_answers` に `UNIQUE KEY uq_user_event (user_id, event_id)` を追加（マイグレーション 05）。重複 INSERT は行わず、既存行があれば UPDATE する（さくらプロキシがエラーを 500 に潰すため、**INSERT 前に SELECT で存在確認**する。server ADR 0001 に従う）。

---

## 6. サーバー仕様（`event-support-server`）

### 6.1 エンドポイント一覧（新規）

| メソッド | パス | 認証 | 説明 |
|---|---|---|---|
| GET | `/api/v1/events/:event_id/app-access` | **なし（公開）** | 実効開放状態の取得。完了画面が参照する |
| GET | `/api/v1/organizer/events/:event_id/app-access` | Bearer（organizer、所有イベントのみ） | 設定値の取得（監査用の `updated_by` / `updated_at` を含む） |
| PUT | `/api/v1/organizer/events/:event_id/app-access` | Bearer（organizer、所有イベントのみ） | 設定値の更新（モード・時刻・締切） |
| GET | `/api/v1/admin/events/:event_id/app-access` | Bearer（staff） | 運営スタッフ向けの読み取り専用 |
| GET | `/api/v1/events/:event_id/pre-survey/questions` | **なし（公開）** | 事前アンケート設問。未ログインでも設問を見せられるようにする |

既存エンドポイントの流用（変更なしで使う）:

- `POST /api/v1/auth/register`（サインアップ）
- `POST /api/v1/auth/login`（サインイン）
- `POST /api/v1/events/:event_id/survey/answers`（回答送信、Bearer）

既存エンドポイントの**変更**:

- `GET /api/v1/events/:event_id/survey/questions` — `answer_type` と正規化済み `options` を返すよう拡張。
- `POST /api/v1/events/:event_id/survey/answers` — 下記 6.3 のバリデーション・締切チェック・upsert を追加。
- `GET /api/v1/events/:event_id/public` — レスポンスに `app_access`（`is_open` / `mode` / `app_opens_at` / `pre_survey_closes_at`）を含める。完了画面の初期表示で 1 リクエスト減らせる。
- `POST /api/v1/organizer/events` — 5.2 の既定行を作成する。
- `CRUD /api/v1/admin/events/:event_id/survey-questions` — `answer_type` と `{value,label}` 形式の `options` に対応。

### 6.2 リクエスト／レスポンス

**GET `/api/v1/events/:event_id/app-access`**（公開）

```json
{
  "data": {
    "event_id": "…",
    "is_open": false,
    "mode": "scheduled",
    "app_opens_at": "2026-08-20T00:30:00.000Z",
    "pre_survey_closes_at": "2026-08-19T14:59:59.000Z",
    "is_pre_survey_open": true,
    "server_time": "2026-08-17T05:00:00.000Z"
  }
}
```

- 公開エンドポイントなので**イベント名等の内部情報は返さない**。存在しない `event_id` は 404。
- `mode` は返して良い（UI の文言切り替えに使う）。`app_closes_at` / `updated_by` は返さない。

**PUT `/api/v1/organizer/events/:event_id/app-access`**

```json
{
  "mode": "scheduled",
  "app_opens_at": "2026-08-20T00:30:00.000Z",
  "app_closes_at": null,
  "pre_survey_closes_at": "2026-08-19T14:59:59.000Z"
}
```

- バリデーション:
  - `mode` は 3 値のいずれか。必須。
  - `mode === 'scheduled'` のとき `app_opens_at` 必須。`mode` が `open` / `closed` のときも `app_opens_at` は**保持する**（予約に戻したときに値が残るよう、null 化しない）。
  - `app_closes_at` を指定する場合は `app_opens_at` より後。
  - `pre_survey_closes_at` は任意。省略時は既存値を維持。
  - 不正は 400（既存のエラー形式に合わせる）。
- レスポンスは更新後の設定値（GET organizer と同形）。
- **監査ログを 1 件書く**（`src/lib/audit.ts`）:
  - `action: 'update'`, `target_type: 'app_access'`, `target_id: event_id`
  - `detail`: 変更前後の `{ mode, app_opens_at, pre_survey_closes_at }`
  - `actor_role`: `'organizer'`（`audit_logs.actor_role` に organizer を入れる。既存の値域に無ければ受け入れられることを確認する）

**GET `/api/v1/events/:event_id/pre-survey/questions`**（公開）

```json
{
  "data": {
    "is_pre_survey_open": true,
    "pre_survey_closes_at": "2026-08-19T14:59:59.000Z",
    "questions": [
      {
        "id": "…uuid…",
        "question_id": "age_group",
        "label": "年代",
        "answer_type": "single",
        "required": true,
        "options": [{ "value": "twenties", "label": "20代" }]
      }
    ]
  }
}
```

### 6.3 回答送信時のルール（`POST /events/:event_id/survey/answers`）

1. Bearer 認証 + `requireEventMatchesJwt`。
2. `is_pre_survey_open === false` なら **409**（`code: 'PRE_SURVEY_CLOSED'`）を返す。締切後の回答は受け付けない。
3. `is_required` の質問が欠けていたら 400。`options` に無い `value` が来たら 400（**離散コードの整合性を守る。分析の前提**）。
4. `answer_type` と値の型が一致すること（`single`→文字列 / `multi`→文字列配列 / `text`→文字列）。
5. `(user_id, event_id)` で既存行を SELECT → あれば UPDATE、無ければ INSERT（5.3 の upsert 方針）。
6. レスポンスに `{ answered_at }` を返す。

### 6.4 ファイル配置

| ファイル | 責務 |
|---|---|
| `src/routes/v1/app-access.ts` | 公開 GET `/events/:event_id/app-access` |
| `src/routes/v1/organizer/app-access.ts` | organizer の GET / PUT |
| `src/routes/v1/admin/app-access.ts` | staff の読み取り専用 GET |
| `src/lib/app-access.ts` | **実効開放状態の算出（§4' のルール）と既定値生成。判定ロジックはここだけに置く** |
| `src/routes/v1/survey.ts` | 既存。事前アンケートの締切チェック・バリデーション・upsert を追加 |

`app.ts` の登録順は既存の並び（public → v1 → organizer → admin）に合わせる。

### 6.5 テスト（`tests/`、vitest）

- `lib/app-access` の算出: 3 モード × 時刻境界（`app_opens_at` の 1 秒前 / 同時刻 / 1 秒後）、`app_closes_at` あり／なし、行なし（closed 扱い）。
- PUT の権限: organizer 所有 → 200、非所有 organizer → 403、`manager` の Bearer → 403、無認証 → 401。
- PUT のバリデーション: `scheduled` かつ `app_opens_at` なし → 400、`app_closes_at < app_opens_at` → 400。
- PUT で監査ログが 1 件増えること。
- 公開 GET: 存在しない event → 404、レスポンスに内部情報が含まれないこと。
- 回答送信: 締切後 → 409、必須欠け → 400、未知の `value` → 400、2 回送信で行が増えず更新されること。

---

## 7. フロントエンド仕様（`event-support-frontend`）

### 7.1 既存モック実装からの差し替え

`src/features/presurvey/` に localStorage ベースのモックが入っている（画面遷移確認用）。差し替え方針:

| 対象 | 対応 |
|---|---|
| `api/presurveyLocalStore.ts` | **削除** |
| `api/presurveyApi.ts` | 中身を実 API 呼び出しに置き換える（下表） |
| `store/presurveySessionStore.ts` | **削除**。認証は `shared/auth/authStore` に統合する（決定 D-1） |
| `config/questions.ts` | 削除せず**フォールバック**として残すか、サーバー配信に完全移行するかを実装時に判断。移行する場合は削除し、設問は `fetchPreSurveyQuestions` の戻り値のみを使う |
| `pages/*` | 遷移構造は維持。サインアップ／サインインを `features/auth/hooks/useAuth` 経由に変更 |
| `types/presurvey.ts` | サーバーレスポンスに合わせて調整（`question_id` の追加など） |

| `presurveyApi.ts` の関数 | 置き換え先 |
|---|---|
| `fetchPreSurveyQuestions` | `GET /events/:event_id/pre-survey/questions` |
| `signUpPreSurvey` | `POST /auth/register`（`useAuth().register` を利用）|
| `signInPreSurvey` | `POST /auth/login`（`useAuth().login` を利用）|
| `submitPreSurveyAnswers` | `POST /events/:event_id/survey/answers` |

サインイン後の分岐（回答済み → `/thanks` / 未回答 → `/form`）は、**サーバーから回答済みフラグを得て判定する**。`GET /events/:event_id/survey/answers/me`（Bearer、無ければ 404）を追加するか、回答送信のレスポンスと合わせて `me` 系エンドポイントに含める。どちらにするかは実装時に server 側と揃えて決め、本文書に追記すること（**未決定事項 §10-a**）。

### 7.2 アプリ公開ゲートの共有部品

feature を越えて使うため `shared/` に置く。

| ファイル | 責務 |
|---|---|
| `src/shared/api/appAccess.ts` | `fetchAppAccess(eventId)` — 公開 GET のラッパー。型 `AppAccess` を export |
| `src/shared/hooks/useAppAccess.ts` | ポーリング（30 秒）+ `server_time` との差分でローカル補正した残り時間を返す |

`useAppAccess(eventId)` の戻り値:

```ts
{
  isOpen: boolean
  mode: 'closed' | 'scheduled' | 'open'
  opensAt: Date | null
  /** 開放までの残りミリ秒。null = 予約なし／既に開放 */
  msUntilOpen: number | null
  loading: boolean
  error: string | null
  /** 手動で再取得（「最新の状態を確認」ボタン用） */
  refresh: () => void
}
```

- 残り時間は `server_time` 受信時刻を基準にした単調な経過時間で計算し、**端末時計を直接使わない**（決定 D-4）。
- 残りが 0 を跨いだ時点で即 `refresh()` を 1 回走らせ、サーバーの判定に合わせる（クライアント計算だけで `isOpen` を true にしない）。
- ポーリングはタブが非表示のとき停止（`document.visibilityState`）。

### 7.3 完了画面（`PreSurveyThanksPage`）

| 状態 | ボタン | 補助表示 |
|---|---|---|
| `isOpen === true` | 有効。押すと `/home`（未ログインなら `/join/:eventId`） | — |
| `isOpen === false` かつ `opensAt` あり | `disabled` | 「アプリは 8/20 09:30 に公開されます（あと 3 時間 12 分）」 |
| `isOpen === false` かつ `opensAt` なし | `disabled` | 「アプリの公開までお待ちください。公開時刻は当日ご案内します」 |
| 取得失敗 | `disabled` | 「公開状態を確認できませんでした」+ 再試行ボタン |

- **ボタンを隠さず disabled にする**。参加者に「後で開く」ことが伝わるようにする。
- 開放された瞬間にボタンが有効化される（再読み込み不要）。

### 7.4 アプリ本体側のガード

完了画面のボタンだけでは URL 直打ちを防げない。`router/index.tsx` の `RequireAuth` の内側に **`RequireAppOpen`** を追加する。

- 対象: `/home`, `/checkin`, `/award-vote`, `/schedule`, `/booth-list`, `/gachapon*`（参加者向け画面すべて）
- 非対象: `/pre-survey/*`, `/login`, `/register`, `/join/:eventId`, `/admin/*`, `/organizer/*`（**運営・主催者はゲートに関係なく使える**）
- 判定に使う `event_id` は `authStore.user.event_id`。
- `isOpen === false` のときは `/pre-survey/:eventId/thanks` へリダイレクトせず、**専用の待機画面 `AppClosedPage`（`features/home/pages/`）** を表示する（アンケート未回答の人を混乱させないため）。カウントダウンと再確認ボタンを置く。
- 判定中（`loading`）は既存のローディング表示に合わせる。**取得失敗時は閉鎖扱いにせず通す**（サーバー障害でイベント当日に全員入れなくなる方が損害が大きい。この fail-open は意図的な判断であり、コメントに明記する）。

### 7.5 主催者ポータル

`features/organizer/` に「アプリ公開」設定を追加する。

| ファイル | 責務 |
|---|---|
| `features/organizer/api/appAccess.ts` | organizer の GET / PUT ラッパー |
| `features/organizer/components/AppAccessPanel.tsx` | 状態表示 + モード切替 + 時刻入力 + 締切入力 |

- 配置先は `OrganizerEventDetailPage` 内のパネル（新規ページは作らない）。
- UI 要素:
  - 現在の実効状態を色付きバッジで表示（開放中 / 予約済み（開放まで hh:mm）/ 閉鎖中）
  - モードのラジオ: 閉鎖 / 予約 / 開放
  - `datetime-local` の開放予定時刻（`scheduled` 選択時のみ活性。値は `open`/`closed` でも保持して表示する）
  - 事前アンケート締切の `datetime-local`
  - **[今すぐ開放] / [今すぐ閉鎖]** のショートカット（それぞれ `mode` を `open` / `closed` にして PUT）
  - `open` に切り替えるときは確認ダイアログ（「参加者が今すぐアプリを使えるようになります」）
- 保存後は GET を再取得して表示を更新する。
- `datetime-local` はローカル時刻。**送信前に ISO8601（UTC）へ変換**する。既存の日時変換ヘルパーがあれば流用し、無ければ `shared/lib/` に追加する。

### 7.6 参加者への URL

- 事前アンケート URL: `<FRONTEND_BASE_URL>/pre-survey/:eventId`
- `POST /organizer/events` が発行する URL 一覧（既存の参加者/運営 URL）に**事前アンケート URL を追加**し、主催者ポータルの詳細画面でコピーできるようにする。

---

## 8. 受け入れ条件（テスト観点）

- [ ] 主催者が `closed` にしている間、完了画面のボタンは disabled で、`/home` に直接アクセスすると `AppClosedPage` が出る。
- [ ] `scheduled` + 開放予定時刻を 1 分後に設定すると、完了画面を開いたまま待って**リロードなしで**ボタンが有効化される。
- [ ] `scheduled` の予約時刻前に [今すぐ開放] を押すと即座に開放される（手動上書き）。その後 `scheduled` に戻すと予約状態に復帰する。
- [ ] `manager` / `viewer` のトークンで PUT すると 403。organizer でも非所有イベントなら 403。
- [ ] ゲート変更が監査ログ一覧（`/admin/audit-logs`）に表示される。
- [ ] 端末時計を 3 時間進めても開放されない（サーバー判定であること）。
- [ ] 事前アンケート締切後の回答送信が 409 になり、フォーム画面に締切済みの案内が出る。
- [ ] 同じ参加者が 2 回回答しても `user_survey_answers` の行が増えず、内容が更新される。
- [ ] 運営・主催者の画面はゲートが `closed` でも従来通り使える。
- [ ] ゲート取得が失敗（サーバー 500）してもアプリ本体には入れる（fail-open、§7.4）。

---

## 9. 実装手順（分割コミット単位）

1. **DB** — `db/migrations/05_app_access_gate.sql`（`event_app_access` 作成 / `survey_questions.answer_type` 追加 / `user_survey_answers` の UNIQUE 追加 / 既存イベントの backfill）。`db/create-tables.sql` を同期（14 テーブル）。
2. **サーバー: 算出ロジック** — `src/lib/app-access.ts` + 単体テスト（§6.5 の第 1 項）。
3. **サーバー: エンドポイント** — 公開 GET / organizer GET・PUT / admin GET、`POST /organizer/events` の既定行作成、監査ログ。テスト追加。
4. **サーバー: 事前アンケート** — `survey.ts` の締切チェック・バリデーション・upsert、`pre-survey/questions`、回答済み判定（§10-a の結論に従う）。
5. **フロント: 共有部品** — `shared/api/appAccess.ts` + `shared/hooks/useAppAccess.ts`。
6. **フロント: 完了画面とガード** — `PreSurveyThanksPage` のボタン制御、`RequireAppOpen`、`AppClosedPage`。
7. **フロント: 主催者パネル** — `AppAccessPanel` を `OrganizerEventDetailPage` に組み込み。
8. **フロント: モック撤去** — `presurvey` の localStorage 実装を実 API に差し替え（§7.1）。
9. **ドキュメント** — 両リポジトリの `AGENTS.md` のエンドポイント表・テーブル数、`docs/ubiquitous-language.md`（§1'）、必要なら ADR を追加（推奨: 「アプリ公開ゲートをサーバー判定 + 3 モードで表現する」）。

> 1〜4 と 5〜8 は別リポジトリなので、**4 まで完了してからフロントに着手する**（フロントは実 API に対して動作確認する）。

---

## 10. 未決定事項（実装前に確認し、本文書に追記する）

- **§10-a 回答済み判定の取得方法** — `GET /events/:event_id/survey/answers/me` を新設するか、既存の参加者向け `me` 系レスポンスに含めるか。フロントの `/signin` 後の分岐に必要。
- **§10-b 開放予定時刻の既定値** — 「開催 30 分前」で確定して良いか（主催者の運用に合わせる）。
- **§10-c 事前アンケートの質問内容** — 現在の `config/questions.ts` は暫定（年代・職業・参加回数・目的・関心分野・知識レベル・期待度 + 自由記述）。ラフ集合分析で使う条件属性の確定版を分析側と合わせる。`industry`（業種）を質問に含めるかもここで決める。
- **§10-d タイムゾーン** — DB の `DATETIME` を UTC で保存する運用と理解しているが、既存コード（`src/lib/datetime.ts`）の扱いを確認して統一する。
- **§10-e 自動閉鎖** — `app_closes_at`（イベント終了後に自動で閉じる）を初回リリースに含めるか、カラムだけ用意して UI は後回しにするか。本文書は**カラムのみ用意・UI は後回し**を前提に書いている。

---

## 11. 関連ドキュメント

- フロント: [AGENTS.md](../../AGENTS.md) / [docs/ubiquitous-language.md](../ubiquitous-language.md) / [ADR 0001](../adrs/0001-features-shared-directory.md)
- サーバー: `event-support-server/AGENTS.md`（エンドポイント表・認証・DB）/ `docs/adrs/0001-sakura-proxy-error-masking.md`（INSERT 前 SELECT）/ `docs/adrs/0002-cloud-run-single-instance-for-websocket.md`
- 分析: `event-support-analytics/README.md`
