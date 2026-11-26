import { v4 as uuidv4 } from 'uuid'
import type { ChunkMetadata } from '@/lib/types'

/**
 * Splits text into overlapping chunks by approximate token (word) count.
 * @param text - raw text to split
 * @param maxTokens - maximum words per chunk
 * @param overlapTokens - words to repeat from the previous chunk at the start of the next
 */
export function chunkText(text: string, maxTokens: number, overlapTokens: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const chunks: string[] = []
  let start = 0

  while (start < words.length) {
    const end = Math.min(start + maxTokens, words.length)
    chunks.push(words.slice(start, end).join(' '))
    if (end >= words.length) break
    start = end - overlapTokens
  }

  return chunks
}

/**
 * Creates chunk metadata for a given page and chunk position.
 */
export function chunkMetadataFromPage(
  source: string,
  page: number,
  chunkIndex: number,
  totalChunks: number
): ChunkMetadata {
  return {
    id: uuidv4(),
    source,
    page,
    chunkIndex,
    totalChunks,
  }
}
