import { sessionKey } from '@/shared/config/storageKeys'

/**
 * 「このセッションでカメラの起動に成功した」フラグ（issue #170）。
 *
 * 読み取り画面は、初回だけ「カメラを起動する」ボタンを挟む（WebView がジェスチャ起点でない
 * 権限要求を黙って拒否するため）。一度成功した端末では権限が通っているので、2 回目以降は自動起動に戻す。
 * タブ単位の一時状態なので sessionStorage に置く。失敗しても機能は止めない。
 */
const KEY = sessionKey('camera-started')

export function hasCameraStartedThisSession(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markCameraStarted(): void {
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    /* 書けなくても続行する */
  }
}
