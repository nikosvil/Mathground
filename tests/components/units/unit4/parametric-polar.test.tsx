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

import { ParametricCurveScene } from '@/components/units/unit4/ParametricCurveScene'
import { PolarCurveScene } from '@/components/units/unit4/PolarCurveScene'

describe('ParametricCurveScene', () => {
  it('renders unit circle parametrically', () => {
    render(<ParametricCurveScene xFn="cos(t)" yFn="sin(t)" tMin={0} tMax={6.28} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('handles invalid expression without throwing', () => {
    expect(() =>
      render(<ParametricCurveScene xFn="2t" yFn="sin(t)" tMin={0} tMax={6} />)
    ).not.toThrow()
  })
})

describe('PolarCurveScene', () => {
  it('renders r=1 unit circle', () => {
    render(<PolarCurveScene rFn="1" thetaMin={0} thetaMax={6.28} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders cardioid r=1+cos(θ)', () => {
    expect(() =>
      render(<PolarCurveScene rFn="1 + cos(θ)" thetaMin={0} thetaMax={6.28} />)
    ).not.toThrow()
  })
})
