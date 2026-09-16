# 02. 認証状態の依存構造の是正

## A-1. 「feature 間の直接 import 禁止」ルールと authStore の矛盾

### 現状

README.md / AGENTS.md は「feature 間の直接 import は禁止。共有は `shared/` に置く」と
定めているが、実際には認証状態が feature 境界を大きく越えている。

**違反 1: feature → feature（6 feature が auth に依存）**

`@/features/auth/store/authStore`（および `isAdminUser` / `isManagerUser`）を
admin・award・booth・checkin・gachapon・home の各 feature と `router/index.tsx` が直接 import している。

**違反 2: shared → feature（依存の逆転）**

- `src/shared/api/client.ts` が `@/features/auth/store/authStore` を import
  （401 時の `clearSession` 呼び出し）

`shared/` は「複数 feature から使われる側」であり、feature へ依存してはならない。
現状はルールが形骸化しており、新規メンバーがどちらに従うべきか判断できない。

### 方針の選択肢

| 案 | 内容 | 利点 | 欠点 |
|----|------|------|------|
| **案 A（採用）** | 認証セッションを `shared/auth/` へ移動する | ルールと実装が一致する。shared → feature の逆依存が消える | 移動対象が多い（import 書き換え 20 箇所超） |
| 案 B | ADR で「auth feature は例外的に他 feature から import 可」と明文化 | 変更が最小 | shared → feature の逆依存（違反 2）は解消されない。例外が例外を呼ぶ |

**案 A を採用する。** 認証セッション（トークン・ユーザー・ロール判定）は全画面が使う
横断的関心事であり、「feature 間で共有が必要なものは shared へ」という既存原則の
適用そのものだから。

### 移動仕様

1. 次を `src/shared/auth/` へ移動する（機能変更なし・ファイル分割は現状維持）:
   - `features/auth/store/authStore.ts` → `shared/auth/authStore.ts`
     （`isJwtExpired` / `isAdminUser` / `isManagerUser` を含む）
   - `features/auth/types/user.ts` → `shared/auth/types.ts`（`AuthUser`）
2. `features/auth/` には**画面と認証 API フロー**を残す:
   pages（Login / Register / Join）、hooks（useAuth）、api、mocks、config
3. authStore が参照している `features/auth/mocks/authMock.ts` /
   `features/auth/config/eventIds.ts` への依存は、モック判定・定数
   （`MOCK_DEV_JWT`・`DEV_DUMMY_EVENT_ID`・`isMockAuthEnabled`）を
   `shared/auth/mockSession.ts`（仮称）に切り出して解決する
   （shared → features の逆依存を新たに作らないこと）
4. 全 import を `@/shared/auth/...` へ書き換える。`features/auth` 配下からの
   再エクスポートは残さない（移行を一度で完了させ、二重の入口を作らない）
5. `organizerStore` は現状どおり `features/organizer/` に置く
   （organizer 画面以外から参照されておらず、境界内に収まっているため）

### ドキュメント反映

- README.md / AGENTS.md のディレクトリ構造に `shared/auth/` を追記する
- `docs/adrs/` に本判断を ADR として記録する
  （タイトル案: 「0003: 認証セッションを shared/auth に配置する」。
  「feature 間 import 禁止」ルールの運用実例として、違反 1・2 の経緯と案 A/B の比較を残す）

### 受け入れ条件

- `grep -rn "from '@/features/" src/features src/shared` の結果に、
  自 feature 以外への参照が存在しない
- `src/shared/` から `@/features/` への import が存在しない
- `npm run build`・`cd tests && npm test` が通る（挙動変更なし）
