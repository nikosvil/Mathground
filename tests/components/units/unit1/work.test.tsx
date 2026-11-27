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

import { WorkScene } from '@/components/units/unit1/WorkScene'

describe('WorkScene', () => {
  it('renders spring paradigm without throwing', () => {
    expect(() =>
      render(<WorkScene paradigm="spring" fn="k*x" k={2} a={0} b={3} L={5} w={2} />)
    ).not.toThrow()
  })

  it('spring scene has a canvas', () => {
    render(<WorkScene paradigm="spring" fn="k*x" k={2} a={0} b={3} L={5} w={2} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders variable force paradigm without throwing', () => {
    expect(() =>
      render(<WorkScene paradigm="variable" fn="x^2" k={1} a={0} b={4} L={5} w={2} />)
    ).not.toThrow()
  })

  it('variable scene has a canvas', () => {
    render(<WorkScene paradigm="variable" fn="x^2" k={1} a={0} b={4} L={5} w={2} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders lifting paradigm without throwing', () => {
    expect(() =>
      render(<WorkScene paradigm="lifting" fn="" k={1} a={0} b={1} L={5} w={2} />)
    ).not.toThrow()
  })

  it('lifting scene has a canvas', () => {
    render(<WorkScene paradigm="lifting" fn="" k={1} a={0} b={1} L={5} w={2} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('displays work value label', () => {
    render(<WorkScene paradigm="spring" fn="k*x" k={2} a={0} b={3} L={5} w={2} />)
    expect(document.body.textContent).toMatch(/W\s*=|work/i)
  })

  it('handles max values without throwing', () => {
    expect(() =>
      render(<WorkScene paradigm="spring" fn="k*x" k={10} a={0} b={5} L={10} w={5} />)
    ).not.toThrow()
  })

  it('handles a=b edge case without throwing', () => {
    expect(() =>
      render(<WorkScene paradigm="spring" fn="k*x" k={2} a={2} b={2} L={5} w={2} />)
    ).not.toThrow()
  })
})
