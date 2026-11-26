import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useThree: vi.fn().mockReturnValue({ camera: { position: { set: vi.fn() } } }),
  useFrame: vi.fn(),
}))
vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import { TopicBreadcrumb } from '@/components/ui/TopicBreadcrumb'
import { SliderPanel } from '@/components/ui/SliderPanel'

describe('TopicBreadcrumb', () => {
  it('renders unit and topic names', () => {
    render(<TopicBreadcrumb unit="Applications of Integration" topic="Volumes by Disks & Washers" />)
    expect(screen.getByText('Applications of Integration')).toBeDefined()
    expect(screen.getByText('Volumes by Disks & Washers')).toBeDefined()
  })
})

describe('SliderPanel', () => {
  it('renders sliders with labels and values', () => {
    const sliders = [
      { id: 'a', label: 'Lower bound a', min: -5, max: 0, step: 0.1, default: -2 },
      { id: 'b', label: 'Upper bound b', min: 0, max: 5, step: 0.1, default: 2 },
    ]
    const values = { a: -2, b: 2 }
    render(<SliderPanel sliders={sliders} values={values} onChange={vi.fn()} />)
    expect(screen.getByText('Lower bound a')).toBeDefined()
    expect(screen.getByText('Upper bound b')).toBeDefined()
  })

  it('calls onChange when slider moved', async () => {
    const onChange = vi.fn()
    const sliders = [{ id: 'n', label: 'Segments n', min: 2, max: 50, step: 1, default: 10 }]
    render(<SliderPanel sliders={[sliders[0]]} values={{ n: 10 }} onChange={onChange} />)
    const input = screen.getByRole('slider')
    fireEvent.change(input, { target: { value: '11' } })
    expect(onChange).toHaveBeenCalled()
  })
})
