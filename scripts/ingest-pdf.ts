/**
 * Ingestion script: reads a PDF and writes chunks as JSON for Task 5 vector import.
 * Usage: npx tsx scripts/ingest-pdf.ts <pdf-path> [output-path]
 *
 * Output: data/chunks.json (array of Chunk objects)
 */
import fs from 'fs'
import path from 'path'
import pdfParse from 'pdf-parse'
import { chunkText, chunkMetadataFromPage } from '../lib/rag/chunker'
import type { Chunk } from '../lib/types'

const MAX_TOKENS = 300
const OVERLAP_TOKENS = 30

async function main() {
  const pdfPath = process.argv[2]
  if (!pdfPath) {
    console.error('Usage: npx tsx scripts/ingest-pdf.ts <pdf-path> [output-path]')
    process.exit(1)
  }

  const outputPath = process.argv[3] ?? path.join(process.cwd(), 'data', 'chunks.json')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })

  console.log(`Reading PDF: ${pdfPath}`)
  const buffer = fs.readFileSync(pdfPath)
  const data = await pdfParse(buffer)

  const sourceName = path.basename(pdfPath, path.extname(pdfPath))
  const allChunks: Chunk[] = []

  // pdf-parse gives full text; split by page using the pagerender callback pattern
  // For simplicity, we process the full text and assign approximate page numbers
  const totalPages = data.numpages
  console.log(`Total pages: ${totalPages}`)

  // Re-parse with page-level extraction
  const pageTexts: string[] = []
  await pdfParse(buffer, {
    pagerender: (pageData: { getTextContent: () => Promise<{ items: Array<{ str: string; transform: number[] }> }> }) => {
      return pageData.getTextContent().then((content) => {
        const text = content.items.map((item) => item.str).join(' ')
        pageTexts.push(text)
        return text
      })
    },
  })

  for (let pageIdx = 0; pageIdx < pageTexts.length; pageIdx++) {
    const pageText = pageTexts[pageIdx].trim()
    if (!pageText) continue

    const rawChunks = chunkText(pageText, MAX_TOKENS, OVERLAP_TOKENS)
    for (let ci = 0; ci < rawChunks.length; ci++) {
      const metadata = chunkMetadataFromPage(sourceName, pageIdx + 1, ci, rawChunks.length)
      allChunks.push({ text: rawChunks[ci], metadata })
    }
  }

  console.log(`Generated ${allChunks.length} chunks from ${pageTexts.length} pages`)
  fs.writeFileSync(outputPath, JSON.stringify(allChunks, null, 2))
  console.log(`Saved to: ${outputPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
