import { describe, expect, it } from 'vitest'
import { buildSharePost } from '@/features/home/share/sharePostTemplate'
import { buildXIntentUrl } from '@/shared/lib/xShare'

describe('buildSharePost', () => {
  it('イベント名を文面に差し込む', () => {
    const post = buildSharePost({ eventName: 'PRoToFES 2026' })
    expect(post.text).toContain('PRoToFES 2026')
  })

  it('ハッシュタグを本文に含める（X の hashtags パラメータはネイティブアプリに無視されるため。issue #169）', () => {
    const post = buildSharePost({ eventName: 'X' })
    expect(post.text).toContain('#PRoToFES')
    // SharePost に hashtags フィールドは無い
    expect('hashtags' in post).toBe(false)
  })

  it('イベント名が空・未指定なら既定語にフォールバックする', () => {
    expect(buildSharePost({ eventName: '   ' }).text).toContain('イベント')
    expect(buildSharePost().text).toContain('イベント')
  })

  it('shareUrl 未指定なら url を持たない', () => {
    expect(buildSharePost({ eventName: 'X' }).url).toBeUndefined()
  })

  it('shareUrl 指定時は trim して url に載せる', () => {
    expect(buildSharePost({ eventName: 'X', shareUrl: '  https://e.example/  ' }).url).toBe('https://e.example/')
  })

  it('本文に URL を含めない（URL は url パラメータで渡す）', () => {
    const post = buildSharePost({ eventName: 'X', shareUrl: 'https://e.example/' })
    expect(post.text).not.toContain('https://')
  })
})

describe('buildXIntentUrl', () => {
  it('正規のエンドポイント x.com/intent/post を使う', () => {
    const url = buildXIntentUrl({ text: 'a b🎯' })
    expect(url.startsWith('https://x.com/intent/post?')).toBe(true)
    expect(new URL(url).searchParams.get('text')).toBe('a b🎯')
  })

  it('text にハッシュタグが含まれ、クエリに hashtags が存在しない', () => {
    const { text, url } = buildSharePost({ eventName: 'X', shareUrl: 'https://e.example/' })
    const q = new URL(buildXIntentUrl({ text, url })).searchParams
    expect(q.get('text')).toContain('#PRoToFES')
    expect(q.has('hashtags')).toBe(false)
    expect(q.get('url')).toBe('https://e.example/')
  })

  it('url 未指定なら url パラメータを付けない', () => {
    const q = new URL(buildXIntentUrl({ text: 't' })).searchParams
    expect(q.has('url')).toBe(false)
  })
})
