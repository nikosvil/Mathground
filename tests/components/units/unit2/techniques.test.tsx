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

import { FunctionPlot2D } from '@/components/units/unit2/FunctionPlot2D'
import { NumericalIntegrationScene } from '@/components/units/unit2/NumericalIntegrationScene'

describe('FunctionPlot2D', () => {
  it('renders a 2D function plot canvas', () => {
    render(<FunctionPlot2D fn="sin(x)" xMin={-3} xMax={3} label="sin(x)" />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders for custom function', () => {
    expect(() =>
      render(<FunctionPlot2D fn="x^2" xMin={-2} xMax={2} label="x²" />)
    ).not.toThrow()
  })

  it('handles invalid expression gracefully', () => {
    expect(() =>
      render(<FunctionPlot2D fn="2x" xMin={0} xMax={1} label="invalid" />)
    ).not.toThrow()
  })
})

describe('NumericalIntegrationScene', () => {
  it('renders without throwing', () => {
    expect(() =>
      render(<NumericalIntegrationScene fn="sin(x)" a={0} b={Math.PI} n={8} />)
    ).not.toThrow()
  })

  it('canvas is present in the DOM', () => {
    render(<NumericalIntegrationScene fn="x^2" a={0} b={2} n={4} method="left" />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders right-endpoint and midpoint methods', () => {
    expect(() =>
      render(<NumericalIntegrationScene fn="cos(x)" a={0} b={3} n={6} method="right" />)
    ).not.toThrow()
    expect(() =>
      render(<NumericalIntegrationScene fn="exp(x)" a={0} b={1} n={5} method="midpoint" />)
    ).not.toThrow()
  })
})
