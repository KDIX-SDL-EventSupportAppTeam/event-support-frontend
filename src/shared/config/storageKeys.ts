/**
 * ブラウザストレージ（localStorage / sessionStorage）のキー規約と掃除の道具。
 * **キーの文字列リテラルはこのファイル以外に書かない。** 直書きが1つでも残ると、
 * 「自分たちが書いたキー」を機械的に列挙できず、掃除から漏れる。
 *
 * authStore（書き込み側）と apiClient（読み取り側）が同じキーを使う点も、ここを参照して揃える。
 */

/** このアプリが書いたキーの印。所有権の判定（`key.startsWith(NS)`）に使う */
export const NS = 'esa:'

/**
 * 保存データのスキーマ版。
 *
 * **`token` / `user` に保存する形を変えたらここを上げる。**
 * 版を上げるとキー名そのものが変わるため、古い形のデータは誰にも読まれなくなり、
 * 起動時の {@link purgeOutdatedStorage} が掃除する。
 * 型が合っていて意味だけ変わった場合（enum の世代ずれ）は読み取り時のバリデーションでは
 * 捕まらないので、版で切るのが確実。
 *
 * **版を上げると全参加者が再ログインになる。イベント当日に上げてはいけない。**
 * 上げる基準は docs/rules/storage.md を参照。
 */
export const STORAGE_VERSION = 1

const PREFIX = `${NS}v${STORAGE_VERSION}:`

// --- 版に追随するキー（形が変わり得る。消えても再ログインで復旧できるもの） ---
export const TOKEN_KEY = `${PREFIX}participant:token`
export const USER_KEY = `${PREFIX}participant:user`
export const ORGANIZER_TOKEN_KEY = `${PREFIX}organizer:token`
export const ORGANIZER_USER_KEY = `${PREFIX}organizer:user`

// --- 版に追随しないキー ---
// 単純な真偽値や ID で、消えても再ログインは不要。版を上げても残す
// （全部を版に乗せると、版を上げるたびに既読フラグまで消えて、重すぎて誰も上げなくなる）。

/** 直近に踏んだ配布リンクの eventId。未認証時の戻り先を決めるために使う */
export const LAST_EVENT_ID_KEY = `${NS}last-event-id`

const EVENT_PREFIX = `${NS}event:`

/** イベント × ユーザー単位の端末フラグ（既読など）。共有端末で他人の状態を出さないため両方を含める */
export const eventScopedKey = (eventId: string, userId: string, name: string) =>
  `${EVENT_PREFIX}${eventId}:user:${userId}:${name}`

/** sessionStorage 用（タブ単位の一時状態）。`suffix` で用途を区別する */
export const sessionKey = (name: string) => `${NS}session:${name}`

/** 版付きキー（`esa:v<数字>:`）の判定 */
const VERSIONED_KEY = /^esa:v\d+:/

/**
 * 規約導入前（〜2026-10）に書かれていたキー。名前空間が無いので所有権を判定できず、
 * 一度だけ名指しで掃除する。新しいデータへの移行はしない（移行コード自体が負債になる。再ログインで足りる）。
 */
const LEGACY_EXACT_KEYS = [
  'token',
  'auth_user',
  'last_event_id',
  'organizer_auth_token',
  'organizer_auth_user',
  'newlyCompletedLines',
]
const LEGACY_PREFIXES = ['coinCompleteSeen_', 'surveyOpened_', 'es_bingo_unlock_played_', 'es_sample_']

/**
 * 条件に合うキーを消す。削除しながら列挙するとインデックスがずれるので、先に集める。
 * 掃除は機能要件ではないため、失敗（プライベートブラウジング等で例外）したら黙って諦める。
 */
export function sweepOwnKeys(storage: Storage, predicate: (key: string) => boolean): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key !== null && predicate(key)) keys.push(key)
    }
    for (const key of keys) storage.removeItem(key)
  } catch {
    /* 掃除は機能要件ではない */
  }
}

function defaultStorages(): Storage[] {
  const out: Storage[] = []
  try {
    out.push(localStorage)
  } catch {
    /* アクセス自体が例外になる環境 */
  }
  try {
    out.push(sessionStorage)
  } catch {
    /* 同上 */
  }
  return out
}

/**
 * 現行版以外の版付きキーと、規約導入前の旧キーを捨てる。
 * 版を持たないキー（`esa:last-event-id`、`esa:event:...`、`esa:session:...`）は消さない。
 * localStorage と sessionStorage の両方を見る。
 */
export function purgeOutdatedStorage(storages: Storage[] = defaultStorages()): void {
  for (const storage of storages) {
    sweepOwnKeys(storage, (key) => {
      if (VERSIONED_KEY.test(key)) return !key.startsWith(PREFIX)
      if (LEGACY_EXACT_KEYS.includes(key)) return true
      return LEGACY_PREFIXES.some((p) => key.startsWith(p))
    })
  }
}

/** 指定イベントに関する端末上の痕跡（既読フラグ等）を消す。ログアウト・イベント切替で使う */
export function purgeEventScopedKeys(eventId: string, storages: Storage[] = defaultStorages()): void {
  if (!eventId) return
  const prefix = `${EVENT_PREFIX}${eventId}:`
  for (const storage of storages) {
    sweepOwnKeys(storage, (key) => key.startsWith(prefix))
  }
}
