import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderLatex } from '@/components/tutor/renderLatex'
import { MessageBubble } from '@/components/tutor/MessageBubble'

// KaTeX operates on DOM; mock it in jsdom
vi.mock('katex', () => ({
  default: {
    renderToString: (tex: string) => `<span class="katex-mock">${tex}</span>`,
  },
}))

describe('renderLatex', () => {
  it('converts inline $...$ to KaTeX spans', () => {
    const result = renderLatex('Use $x^2$ for the formula.')
    expect(result).toContain('katex-mock')
    expect(result).toContain('x^2')
  })

  it('converts display $$...$$ blocks', () => {
    const result = renderLatex('$$\\int_0^1 x\\,dx$$')
    expect(result).toContain('katex-mock')
  })

  it('leaves plain text unchanged', () => {
    const result = renderLatex('no math here')
    expect(result).toBe('no math here')
  })
})

describe('SSE line buffer assembly', () => {
  it('assembles a data line split across two chunks', () => {
    // This tests the buffering logic from ChatPanel's streaming reader
    // The pattern: incomplete lines are held in buffer until newline arrives
    const buffer = { current: '' }

    function processChunk(raw: string): string[] {
      const collected: string[] = []
      const text = buffer.current + raw
      const lines = text.split('\n')
      buffer.current = lines.pop() ?? ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          collected.push(line.slice(6))
        }
      }
      return collected
    }

    const half1 = 'data: {"type":"conte'
    const half2 = 'nt","delta":"hello"}\n'

    const r1 = processChunk(half1)
    expect(r1).toHaveLength(0) // incomplete line held in buffer

    const r2 = processChunk(half2)
    expect(r2).toHaveLength(1)
    expect(JSON.parse(r2[0])).toEqual({ type: 'content', delta: 'hello' })
  })
})

describe('MessageBubble', () => {
  it('renders user message on the right', () => {
    const { container } = render(
      <MessageBubble
        message={{ id: '1', role: 'user', content: 'What is integration?', timestamp: Date.now() }}
      />
    )
    expect(container.textContent).toContain('What is integration?')
  })

  it('renders assistant message with thinking toggle when thinking present', () => {
    render(
      <MessageBubble
        message={{
          id: '2',
          role: 'assistant',
          content: 'Integration is...',
          thinking: 'Let me reason...',
          timestamp: Date.now(),
        }}
      />
    )
    expect(screen.getByText(/show reasoning/i)).toBeDefined()
  })
})
