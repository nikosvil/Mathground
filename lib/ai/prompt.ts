import type { ChatMessage, RetrievedChunk } from '@/lib/types'

export interface PromptContext {
  topicTitle?: string
  paradigmLabel?: string
  sliderValues?: Record<string, number>
}

export function buildSystemPrompt(chunks: RetrievedChunk[], context?: PromptContext): string {
  const contextSection =
    chunks.length > 0
      ? `\n\n## Relevant Textbook Context\n\n${chunks
          .map((c, i) => `[${i + 1}] (page ${c.metadata.page}): ${c.text}`)
          .join('\n\n')}`
      : ''

  const topicSection = context?.topicTitle
    ? `\n\n## Current Topic\n\nThe student is currently viewing: **${context.topicTitle}**${context.paradigmLabel ? ` — ${context.paradigmLabel}` : ''}${context.sliderValues && Object.keys(context.sliderValues).length > 0 ? `\nSlider values: ${JSON.stringify(context.sliderValues)}` : ''}`
    : ''

  return `You are an expert calculus tutor helping university students understand Calculus II concepts.

Your role:
- Explain concepts clearly with step-by-step reasoning
- Use LaTeX for all mathematical expressions (wrap in $ or $$ delimiters)
- Reference the textbook context when available
- Be encouraging but precise — do not gloss over mathematical rigor
- For proofs and derivations, show each step and explain the reasoning
${topicSection}${contextSection}`
}

export function buildMessages(
  history: ChatMessage[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return history
    .filter((m) => m.content.trim().length > 0)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
}
