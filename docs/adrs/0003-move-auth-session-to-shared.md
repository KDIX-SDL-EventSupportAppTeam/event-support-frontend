# ADR 0003: 認証セッションを shared/auth に配置する

- **日付:** 2026-07-03
- **ステータス:** 採用

## 状況

README.md / AGENTS.md は「feature 間の直接 import は禁止。共有は `shared/` に置く」と定めているが、
2026-07-02 のコードレビューで、認証状態がこの原則から大きく外れていることが判明した。

**違反 1: feature → feature（6 feature が auth に依存）**

`@/features/auth/store/authStore`（および `isAdminUser` / `isManagerUser`）を
admin・award・booth・checkin・gachapon・home の各 feature と `router/index.tsx` が直接 import していた。

**違反 2: shared → feature（依存の逆転）**

`src/shared/api/client.ts` が `@/features/auth/store/authStore` を import していた
（401 時の `clearSession` 呼び出しのため）。`shared/` は「複数 feature から使われる側」であり、
feature へ依存してはならない。

## 決定

認証セッション（トークン・ユーザー・ロール判定）を `shared/auth/` へ移動する。

- `features/auth/store/authStore.ts` → `shared/auth/authStore.ts`
  （`isJwtExpired` / `isAdminUser` / `isManagerUser` を含む）
- `features/auth/types/user.ts` → `shared/auth/types.ts`（`AuthUser`）
- モック判定・定数（`MOCK_DEV_JWT` / `DEV_DUMMY_EVENT_ID` / `isMockAuthEnabled`）を
  `shared/auth/mockSession.ts` に切り出し、authStore からの `features/auth/mocks/*` への
  依存（= shared → features の新たな逆依存）が発生しないようにした
- `features/auth/` には画面と認証 API フロー（pages / hooks / api / mocks / config）を残す
- 全 import を `@/shared/auth/...` へ書き換え、`features/auth` 配下からの再エクスポートは残していない
- `organizerStore` は現状どおり `features/organizer/` に置く（organizer 画面以外から参照されておらず、境界内に収まっているため）

採用理由: 認証セッションは全画面が使う横断的関心事であり、
「feature 間で共有が必要なものは shared へ」という既存原則の適用そのものだから。

## 検討した代替案（却下）

ADR で「auth feature は例外的に他 feature から import 可」と明文化する案は、変更が最小で済むが
shared → feature の逆依存（違反 2）が解消されず、例外が例外を呼ぶ構造になるため却下した。

## 結果

- `src/shared/` から `@/features/` への import が存在しない
- feature → feature の認証系 import はすべて `@/shared/auth/...` に置き換わった
- `npm run build`・`cd tests && npm test` は挙動変更なしで通る
