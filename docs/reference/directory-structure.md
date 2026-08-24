---
状態: 実装済み
最終更新: 2026-08-24
---

> **現状の事実を記録する文書。** 「これからどうするか」は [../specs/](../specs/README.md) を見ること。

# ディレクトリ構成

### ディレクトリ構成

```
src/
├── features/
│   ├── auth/          # ログイン・登録・認証（store, hooks, api, mocks）
│   ├── home/          # ホーム・ビンゴ
│   ├── booth/         # ブース一覧
│   ├── checkin/       # チェックイン・評価・推薦
│   ├── gachapon/      # ガチャポン
│   ├── award/         # アワード投票
│   ├── schedule/      # スケジュール
│   ├── qa/            # Q&A
│   ├── presurvey/     # 事前アンケート5画面（現状は localStorage のモック）
│   ├── admin/         # 運営管理（ダッシュボード・CRUD）
│   ├── exhibitor/     # 出展者ダッシュボード・出展者ロール判定（store, hooks, pages）
│   └── organizer/     # 主催者ポータル（guards / pages / store / api / components）
├── shared/
│   ├── api/           # v1 / legacy HTTP クライアント
│   ├── auth/          # 認証セッション（authStore・AuthUser 型・モック判定）
│   ├── data/          # EventDataSource / ParticipantClient（移行期）
│   ├── hooks/         # 複数 feature から使う hooks
│   ├── types/         # 共通型
│   ├── lib/           # ユーティリティ
│   └── styles/        # グローバル SCSS
├── router/
│   └── index.tsx
├── App.tsx
└── main.tsx
```

**原則：feature 間の直接 import は禁止。** 共有は `shared/` に置く。認証セッション（token・user・ロール判定）は `shared/auth/` に置き、`features/auth/` には画面と認証 API フローのみを残す（[ADR 0003](../decisions/adrs/0003-move-auth-session-to-shared.md)）。

| feature | 主なパス |
|---------|----------|
| auth | `features/auth/{pages,hooks,api,mocks,config,types}` |
| home | `features/home/{pages,hooks,styles}` |
| booth | `features/booth/{pages,styles}` |
| checkin | `features/checkin/pages` |
| gachapon | `features/gachapon/pages` |
| award | `features/award/{pages,hooks}` |
| schedule / qa | `features/{schedule,qa}/pages` |
| presurvey | `features/presurvey/{pages,components,api,config,store,types}` · **現状は localStorage のモック** |
| admin | `features/admin/{pages,components}` · API: `shared/api/v1Admin.ts` |
| exhibitor | `features/exhibitor/{pages,hooks,store}` · API: `shared/api/v1Exhibitor.ts` |
| organizer | `features/organizer/{pages,store,api,guards,components}` |
