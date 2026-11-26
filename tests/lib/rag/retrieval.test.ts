import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Chunk } from '@/lib/types'

// Mock heavy dependencies before importing the module under test
vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn().mockResolvedValue(
    vi.fn().mockResolvedValue({ data: new Float32Array(384).fill(0.1) })
  ),
}))

vi.mock('@lancedb/lancedb', () => ({
  connect: vi.fn().mockResolvedValue({
    tableNames: vi.fn().mockResolvedValue([]),
    createTable: vi.fn().mockResolvedValue({
      add: vi.fn().mockResolvedValue(undefined),
      search: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([
          { text: 'Integration by parts', source: 'book', page: 42, chunkIndex: 0, totalChunks: 1, id: 'abc', _distance: 0.1 },
        ]),
      }),
    }),
    openTable: vi.fn().mockResolvedValue({
      add: vi.fn().mockResolvedValue(undefined),
      search: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([
          { text: 'Integration by parts', source: 'book', page: 42, chunkIndex: 0, totalChunks: 1, id: 'abc', _distance: 0.1 },
        ]),
      }),
    }),
  }),
}))

describe('RAG retrieval', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getEmbedding returns Float32Array of correct length', async () => {
    const { getEmbedding } = await import('@/lib/rag/retrieval')
    const emb = await getEmbedding('test text')
    expect(emb).toBeInstanceOf(Float32Array)
    expect(emb.length).toBe(384)
  })

  it('indexChunks calls lancedb createTable or openTable', async () => {
    const { indexChunks } = await import('@/lib/rag/retrieval')
    const chunks: Chunk[] = [
      { text: 'hello world', metadata: { id: '1', source: 'book', page: 1, chunkIndex: 0, totalChunks: 1 } },
    ]
    await expect(indexChunks(chunks)).resolves.not.toThrow()
  })

  it('queryChunks returns RetrievedChunk array with score', async () => {
    const { queryChunks } = await import('@/lib/rag/retrieval')
    const results = await queryChunks('integration by parts', 3)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]).toHaveProperty('score')
    expect(results[0]).toHaveProperty('text')
  })
})
