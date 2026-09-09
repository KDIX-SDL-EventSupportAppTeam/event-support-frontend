import { describe, expect, it } from 'vitest'
import { buildSharePost } from '@/features/home/share/sharePostTemplate'
import { buildXIntentUrl } from '@/shared/lib/xShare'

describe('buildSharePost', () => {
  it('イベント名を文面に差し込む', () => {
    const post = buildSharePost({ eventName: 'PRoToFES 2026' })
    expect(post.text).toContain('PRoToFES 2026')
    expect(post.hashtags).toContain('PRoToFES')
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

  it('本文に URL・ハッシュタグ記号を含めない（責務分離）', () => {
    const post = buildSharePost({ eventName: 'X', shareUrl: 'https://e.example/' })
    expect(post.text).not.toContain('https://')
    expect(post.text).not.toContain('#')
  })
})

describe('buildXIntentUrl', () => {
  it('text をエンコードして intent URL を組み立てる', () => {
    const url = buildXIntentUrl({ text: 'a b🎯' })
    expect(url.startsWith('https://twitter.com/intent/tweet?')).toBe(true)
    const q = new URL(url).searchParams
    expect(q.get('text')).toBe('a b🎯')
  })

  it('hashtags / url をパラメータとして付ける', () => {
    const q = new URL(buildXIntentUrl({ text: 't', hashtags: ['A', ' B '], url: 'https://e.example/' })).searchParams
    expect(q.get('hashtags')).toBe('A,B')
    expect(q.get('url')).toBe('https://e.example/')
  })

  it('hashtags 空・url 未指定なら該当パラメータを付けない', () => {
    const q = new URL(buildXIntentUrl({ text: 't', hashtags: [] })).searchParams
    expect(q.has('hashtags')).toBe(false)
    expect(q.has('url')).toBe(false)
  })
})
