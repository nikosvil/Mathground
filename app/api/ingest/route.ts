import { NextResponse } from 'next/server'
import { indexChunks } from '@/lib/rag/retrieval'
import type { Chunk } from '@/lib/types'
import path from 'path'
import fs from 'fs/promises'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const chunksPath = path.join(process.cwd(), 'data', 'chunks.json')

  let chunks: Chunk[]
  try {
    const raw = await fs.readFile(chunksPath, 'utf-8')
    chunks = JSON.parse(raw) as Chunk[]
  } catch {
    return NextResponse.json({ error: 'chunks.json not found — run scripts/ingest.ts first' }, { status: 404 })
  }

  await indexChunks(chunks)
  return NextResponse.json({ indexed: chunks.length })
}
