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
