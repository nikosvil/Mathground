import { describe, it, expect } from 'vitest'
import { chunkText, chunkMetadataFromPage } from '@/lib/rag/chunker'

describe('chunkText', () => {
  it('splits text into chunks of maxTokens length', () => {
    const text = 'word '.repeat(400) // ~400 words
    const chunks = chunkText(text, 100, 20)
    expect(chunks.length).toBeGreaterThan(1)
    // each chunk should not exceed maxTokens (approximate by word count)
    for (const c of chunks) {
      expect(c.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(130) // allow some slack
    }
  })

  it('overlaps chunks by overlapTokens words', () => {
    const words = Array.from({ length: 200 }, (_, i) => `word${i}`)
    const text = words.join(' ')
    const chunks = chunkText(text, 50, 10)
    expect(chunks.length).toBeGreaterThan(1)
    // last words of chunk[0] should appear at start of chunk[1]
    const lastOfFirst = chunks[0].split(/\s+/).slice(-10).join(' ')
    expect(chunks[1]).toContain(lastOfFirst.split(' ')[0])
  })

  it('returns single chunk for short text', () => {
    const text = 'short text here'
    const chunks = chunkText(text, 100, 20)
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toBe(text)
  })

  it('handles empty text', () => {
    const chunks = chunkText('', 100, 20)
    expect(chunks).toEqual([])
  })
})

describe('chunkMetadataFromPage', () => {
  it('creates metadata with page number and chunk index', () => {
    const meta = chunkMetadataFromPage('Thomas Calculus', 42, 2, 5)
    expect(meta.source).toBe('Thomas Calculus')
    expect(meta.page).toBe(42)
    expect(meta.chunkIndex).toBe(2)
    expect(meta.totalChunks).toBe(5)
  })

  it('id is unique per chunk', () => {
    const a = chunkMetadataFromPage('book', 1, 0, 2)
    const b = chunkMetadataFromPage('book', 1, 1, 2)
    expect(a.id).not.toBe(b.id)
  })
})
