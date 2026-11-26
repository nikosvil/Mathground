import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildSystemPrompt, buildMessages } from '@/lib/ai/prompt'
import type { ChatMessage, RetrievedChunk } from '@/lib/types'

describe('buildSystemPrompt', () => {
  it('includes context when chunks provided', () => {
    const chunks: RetrievedChunk[] = [
      { text: 'Integration by parts formula', metadata: { id: '1', source: 'book', page: 5, chunkIndex: 0, totalChunks: 1 }, score: 0.9 },
    ]
    const prompt = buildSystemPrompt(chunks)
    expect(prompt).toContain('Integration by parts formula')
    expect(prompt).toContain('calculus')
  })

  it('still valid with no chunks', () => {
    const prompt = buildSystemPrompt([])
    expect(prompt.length).toBeGreaterThan(50)
    expect(prompt).toContain('calculus')
  })
})

describe('buildMessages', () => {
  it('converts ChatMessage array to OpenAI format', () => {
    const history: ChatMessage[] = [
      { id: '1', role: 'user', content: 'What is integration?', timestamp: Date.now() },
      { id: '2', role: 'assistant', content: 'Integration is...', timestamp: Date.now() },
    ]
    const msgs = buildMessages(history)
    expect(msgs).toHaveLength(2)
    expect(msgs[0].role).toBe('user')
    expect(msgs[0].content).toBe('What is integration?')
    expect(msgs[1].role).toBe('assistant')
  })

  it('filters out messages with no content', () => {
    const history: ChatMessage[] = [
      { id: '1', role: 'user', content: '', timestamp: Date.now() },
      { id: '2', role: 'user', content: 'hello', timestamp: Date.now() },
    ]
    const msgs = buildMessages(history)
    expect(msgs).toHaveLength(1)
  })
})
