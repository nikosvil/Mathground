import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useThree: vi.fn().mockReturnValue({ camera: { position: { set: vi.fn() } } }),
  useFrame: vi.fn(),
}))
vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
}))

import { TaylorSeriesScene } from '@/components/units/unit3/TaylorSeriesScene'
import { PartialSumsScene } from '@/components/units/unit3/PartialSumsScene'
import { SequenceScene } from '@/components/units/unit3/SequenceScene'
import { FourierSeriesScene } from '@/components/units/unit3/FourierSeriesScene'

describe('TaylorSeriesScene', () => {
  it('renders without throwing', () => {
    expect(() =>
      render(<TaylorSeriesScene fn="sin(x)" x0={0} degree={5} xMin={-4} xMax={4} />)
    ).not.toThrow()
  })

  it('renders for cos(x)', () => {
    expect(() =>
      render(<TaylorSeriesScene fn="cos(x)" x0={0} degree={3} xMin={-3} xMax={3} />)
    ).not.toThrow()
  })
})

describe('PartialSumsScene', () => {
  it('renders bar chart of partial sums', () => {
    render(
      <PartialSumsScene
        termFn={(n) => 1 / (n * n)}
        numTerms={20}
        label="Σ 1/n²"
      />
    )
    expect(screen.getByTestId('canvas')).toBeDefined()
  })
})

describe('SequenceScene', () => {
  it('renders without throwing', () => {
    expect(() =>
      render(<SequenceScene termFn="1/n" N={20} />)
    ).not.toThrow()
  })

  it('canvas is present in the DOM', () => {
    render(<SequenceScene termFn="(-1)^n / n" N={15} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('handles divergent sequences gracefully', () => {
    expect(() =>
      render(<SequenceScene termFn="n / 10" N={30} />)
    ).not.toThrow()
  })
})

describe('FourierSeriesScene', () => {
  it('renders square wave without throwing', () => {
    expect(() =>
      render(<FourierSeriesScene waveType="square-wave" N={5} />)
    ).not.toThrow()
  })

  it('canvas is present for square wave', () => {
    render(<FourierSeriesScene waveType="square-wave" N={3} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders sawtooth wave without throwing', () => {
    expect(() =>
      render(<FourierSeriesScene waveType="sawtooth" N={5} />)
    ).not.toThrow()
  })

  it('canvas is present for sawtooth wave', () => {
    render(<FourierSeriesScene waveType="sawtooth" N={10} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders with N=1 (single harmonic)', () => {
    expect(() =>
      render(<FourierSeriesScene waveType="square-wave" N={1} />)
    ).not.toThrow()
  })

  it('renders with N=20 (many harmonics, Gibbs visible)', () => {
    expect(() =>
      render(<FourierSeriesScene waveType="sawtooth" N={20} />)
    ).not.toThrow()
  })
})
