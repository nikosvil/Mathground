import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StepController } from '@/components/visualization/StepController'

function makeProps(overrides: Partial<Parameters<typeof StepController>[0]> = {}) {
  return {
    currentStep: 2,
    totalSteps: 5,
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  }
}

describe('StepController', () => {
  it('renders step counter text', () => {
    render(<StepController {...makeProps()} />)
    expect(screen.getByText('Step 2 of 5')).toBeDefined()
  })

  it('Prev button is disabled at step 1', () => {
    render(<StepController {...makeProps({ currentStep: 1 })} />)
    const btn = screen.getByRole('button', { name: /prev/i })
    expect((btn as HTMLButtonElement).disabled).toBe(true)
  })

  it('Next button is disabled at last step', () => {
    render(<StepController {...makeProps({ currentStep: 5 })} />)
    const btn = screen.getByRole('button', { name: /next/i })
    expect((btn as HTMLButtonElement).disabled).toBe(true)
  })

  it('clicking Next calls onNext', () => {
    const props = makeProps()
    render(<StepController {...props} />)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(props.onNext).toHaveBeenCalledOnce()
  })

  it('clicking Prev calls onPrev', () => {
    const props = makeProps()
    render(<StepController {...props} />)
    fireEvent.click(screen.getByRole('button', { name: /prev/i }))
    expect(props.onPrev).toHaveBeenCalledOnce()
  })

  it('clicking Reset calls onReset', () => {
    const props = makeProps()
    render(<StepController {...props} />)
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(props.onReset).toHaveBeenCalledOnce()
  })

  // Keyboard navigation
  it('ArrowRight key calls onNext when not at last step', () => {
    const props = makeProps({ currentStep: 2, totalSteps: 5 })
    render(<StepController {...props} />)
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(props.onNext).toHaveBeenCalledOnce()
  })

  it('ArrowLeft key calls onPrev when not at first step', () => {
    const props = makeProps({ currentStep: 2, totalSteps: 5 })
    render(<StepController {...props} />)
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(props.onPrev).toHaveBeenCalledOnce()
  })

  it('ArrowRight key does not call onNext when at last step', () => {
    const props = makeProps({ currentStep: 5, totalSteps: 5 })
    render(<StepController {...props} />)
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(props.onNext).not.toHaveBeenCalled()
  })

  it('ArrowLeft key does not call onPrev when at first step', () => {
    const props = makeProps({ currentStep: 1, totalSteps: 5 })
    render(<StepController {...props} />)
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(props.onPrev).not.toHaveBeenCalled()
  })

  // Progress bar
  it('renders a progress bar element', () => {
    render(<StepController {...makeProps()} />)
    expect(screen.getByRole('progressbar')).toBeDefined()
  })

  it('progress bar has correct width for step 2 of 5 (40%)', () => {
    render(<StepController {...makeProps({ currentStep: 2, totalSteps: 5 })} />)
    const bar = screen.getByTestId('step-progress-fill')
    expect((bar as HTMLElement).style.width).toBe('40%')
  })

  it('progress bar is 100% at last step', () => {
    render(<StepController {...makeProps({ currentStep: 5, totalSteps: 5 })} />)
    const bar = screen.getByTestId('step-progress-fill')
    expect((bar as HTMLElement).style.width).toBe('100%')
  })
})
