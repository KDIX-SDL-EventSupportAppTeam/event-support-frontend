import { describe, expect, it } from 'vitest'
import { detectInAppBrowser, detectPlatform } from '@/shared/lib/detectEnvironment'

const UA = {
  iosSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iosChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.153 Mobile/15E148 Safari/604.1',
  // iOS の WebView（メールアプリ内ブラウザなど）は Safari/ を名乗らない
  iosWebView:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  iosLine:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Line/14.8.0',
  iosGmail:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/330.0.0 Mobile/15E148 Safari/604.1',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  androidWebView:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36',
  facebook:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/450.0.0]',
  desktopChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
}

describe('detectInAppBrowser（issue #170）', () => {
  it('通常のブラウザはアプリ内ブラウザと判定しない', () => {
    expect(detectInAppBrowser(UA.iosSafari)).toBeNull()
    expect(detectInAppBrowser(UA.iosChrome)).toBeNull()
    expect(detectInAppBrowser(UA.androidChrome)).toBeNull()
    expect(detectInAppBrowser(UA.desktopChrome)).toBeNull()
  })

  it('LINE / Gmail(GSA) / Facebook を判定する', () => {
    expect(detectInAppBrowser(UA.iosLine)).toBe('line')
    expect(detectInAppBrowser(UA.iosGmail)).toBe('gmail')
    expect(detectInAppBrowser(UA.facebook)).toBe('facebook')
  })

  it('iOS の素の WebView（Safari を名乗らない）と Android WebView を判定する', () => {
    expect(detectInAppBrowser(UA.iosWebView)).toBe('other')
    expect(detectInAppBrowser(UA.androidWebView)).toBe('other')
  })

  it('空文字・未定義相当でも例外を投げず null', () => {
    expect(detectInAppBrowser('')).toBeNull()
    expect(detectInAppBrowser(undefined as unknown as string)).toBeNull()
  })
})

describe('detectPlatform（issue #171）', () => {
  it('iOS / Android / その他を判定する', () => {
    expect(detectPlatform(UA.iosSafari)).toBe('ios')
    expect(detectPlatform(UA.iosChrome)).toBe('ios')
    expect(detectPlatform(UA.androidChrome)).toBe('android')
    expect(detectPlatform(UA.desktopChrome)).toBe('other')
    expect(detectPlatform('')).toBe('other')
  })
})
