import type { ChatMessage, RetrievedChunk } from '@/lib/types'

export function buildSystemPrompt(chunks: RetrievedChunk[]): string {
  const contextSection =
    chunks.length > 0
      ? `\n\n## Relevant Textbook Context\n\n${chunks
          .map((c, i) => `[${i + 1}] (page ${c.metadata.page}): ${c.text}`)
          .join('\n\n')}`
      : ''

  return `You are an expert calculus tutor helping university students understand Calculus II concepts.

Your role:
- Explain concepts clearly with step-by-step reasoning
- Use LaTeX for all mathematical expressions (wrap in $ or $$ delimiters)
- Reference the textbook context when available
- Be encouraging but precise — do not gloss over mathematical rigor
- For proofs and derivations, show each step and explain the reasoning
${contextSection}`
}

export function buildMessages(
  history: ChatMessage[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return history
    .filter((m) => m.content.trim().length > 0)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
}
