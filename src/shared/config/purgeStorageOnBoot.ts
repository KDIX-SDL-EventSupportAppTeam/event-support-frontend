import { purgeOutdatedStorage } from './storageKeys'

/**
 * 起動時に1回だけ、古い版・旧規約のストレージキーを掃除する（副作用 import 専用）。
 *
 * **`main.tsx` の最初の import に置くこと。** `authStore` は zustand の `create` をモジュール評価時に実行し、
 * その中で `readInitialSession()` が localStorage を読む。`authStore` を import した後に掃除しても、
 * 既に読み終わっている。ES モジュールは import の記述順に評価されるため、先頭に置けば先に走る。
 */
purgeOutdatedStorage()
