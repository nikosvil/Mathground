import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useThree: vi.fn().mockReturnValue({ camera: { position: { set: vi.fn() }, lookAt: vi.fn() } }),
  useFrame: vi.fn(),
}))
vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
}))

import { ArcLengthScene } from '@/components/units/unit1/ArcLengthScene'

describe('ArcLengthScene', () => {
  it('renders without throwing', () => {
    expect(() =>
      render(<ArcLengthScene fn="sin(x)" a={0} b={6.28} n={8} />)
    ).not.toThrow()
  })

  it('renders a canvas', () => {
    render(<ArcLengthScene fn="sin(x)" a={0} b={6.28} n={8} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('displays both polygonal and integral length estimates', () => {
    render(<ArcLengthScene fn="sin(x)" a={0} b={6.28} n={8} />)
    expect(document.body.textContent).toMatch(/L_[n8]/i)
  })

  it('renders with n=2 (minimum) without throwing', () => {
    expect(() =>
      render(<ArcLengthScene fn="sin(x)" a={0} b={3.14} n={2} />)
    ).not.toThrow()
  })

  it('renders with n=50 (maximum) without throwing', () => {
    expect(() =>
      render(<ArcLengthScene fn="x^2" a={-2} b={2} n={50} />)
    ).not.toThrow()
  })

  it('handles a custom function (x^2) without throwing', () => {
    expect(() =>
      render(<ArcLengthScene fn="x^2" a={0} b={3} n={10} />)
    ).not.toThrow()
  })

  it('handles invalid expression without throwing', () => {
    expect(() =>
      render(<ArcLengthScene fn="2x" a={0} b={3} n={8} />)
    ).not.toThrow()
  })

  it('handles a=b edge case without throwing', () => {
    expect(() =>
      render(<ArcLengthScene fn="sin(x)" a={1} b={1} n={8} />)
    ).not.toThrow()
  })
})
