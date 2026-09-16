/**
 * localStorage のキー名を一元管理する。
 * authStore（書き込み側）と apiClient（読み取り側）で同じキーを使うため、
 * 文字列を直書きせず必ずここを参照する。
 */
export const TOKEN_KEY = 'token'
export const USER_KEY = 'auth_user'
/** 直近に踏んだ配布リンクの eventId。未認証時の戻り先を決めるために使う */
export const LAST_EVENT_ID_KEY = 'last_event_id'
