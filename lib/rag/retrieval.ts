import path from 'path'
import type { Chunk, RetrievedChunk } from '@/lib/types'

const TABLE_NAME = 'mathground_chunks'
const DB_PATH = path.join(process.cwd(), 'data', 'vectors')
const MODEL = 'Xenova/all-MiniLM-L6-v2'
const VECTOR_DIM = 384

type EmbedderFn = (text: string, options?: Record<string, unknown>) => Promise<{ data: Float32Array }>
let _embedder: EmbedderFn | null = null

async function getEmbedder(): Promise<EmbedderFn> {
  if (_embedder) return _embedder
  const { pipeline } = await import('@xenova/transformers')
  _embedder = await pipeline('feature-extraction', MODEL) as unknown as EmbedderFn
  return _embedder
}

export async function getEmbedding(text: string): Promise<Float32Array> {
  const embedder = await getEmbedder()
  const result = await embedder(text, { pooling: 'mean', normalize: true })
  return result.data as Float32Array
}

let _table: {
  add: (rows: Record<string, unknown>[]) => Promise<void>
  search: (vec: number[]) => { limit: (n: number) => { toArray: () => Promise<Record<string, unknown>[]> } }
} | null = null

async function getTable() {
  if (_table) return _table

  const lancedb = await import('@lancedb/lancedb')
  const db = await lancedb.connect(DB_PATH)
  const names = await db.tableNames()

  if (names.includes(TABLE_NAME)) {
    _table = await db.openTable(TABLE_NAME)
  } else {
    // Create table with a placeholder row to establish schema; it will be cleared on first real add
    _table = await db.createTable(TABLE_NAME, [
      {
        vector: Array(VECTOR_DIM).fill(0),
        text: '',
        id: '__schema__',
        source: '',
        page: 0,
        chunkIndex: 0,
        totalChunks: 0,
      },
    ])
  }

  return _table
}

export async function indexChunks(chunks: Chunk[]): Promise<void> {
  const table = await getTable()

  const rows = await Promise.all(
    chunks.map(async (chunk) => {
      const embedding = await getEmbedding(chunk.text)
      return {
        vector: Array.from(embedding),
        text: chunk.text,
        id: chunk.metadata.id,
        source: chunk.metadata.source,
        page: chunk.metadata.page,
        chunkIndex: chunk.metadata.chunkIndex,
        totalChunks: chunk.metadata.totalChunks,
      }
    })
  )

  await table.add(rows)
}

export async function queryChunks(query: string, topK: number = 5): Promise<RetrievedChunk[]> {
  const table = await getTable()
  const embedding = await getEmbedding(query)

  const rawResults = await table
    .search(Array.from(embedding))
    .limit(topK)
    .toArray()

  return rawResults.map((row) => ({
    text: String(row.text ?? ''),
    metadata: {
      id: String(row.id ?? ''),
      source: String(row.source ?? ''),
      page: Number(row.page ?? 0),
      chunkIndex: Number(row.chunkIndex ?? 0),
      totalChunks: Number(row.totalChunks ?? 0),
    },
    score: 1 - Number(row._distance ?? 0),
  }))
}
