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
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three')
  return {
    ...actual,
    BufferGeometry: vi.fn().mockImplementation(() => ({
      setIndex: vi.fn(),
      setAttribute: vi.fn(),
      dispose: vi.fn(),
    })),
    Float32BufferAttribute: vi.fn().mockImplementation(() => ({})),
    DoubleSide: 2,
  }
})

import { TrigIntegralsScene } from '@/components/units/unit2/TrigIntegralsScene'

describe('TrigIntegralsScene', () => {
  it('renders sin-cos paradigm without throwing', () => {
    expect(() =>
      render(<TrigIntegralsScene paradigm="sin-cos" m={2} n={3} />)
    ).not.toThrow()
  })

  it('sin-cos scene has a canvas', () => {
    render(<TrigIntegralsScene paradigm="sin-cos" m={2} n={3} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders tan-sec paradigm without throwing', () => {
    expect(() =>
      render(<TrigIntegralsScene paradigm="tan-sec" m={2} n={2} />)
    ).not.toThrow()
  })

  it('tan-sec scene has a canvas', () => {
    render(<TrigIntegralsScene paradigm="tan-sec" m={2} n={2} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('displays integral value label', () => {
    render(<TrigIntegralsScene paradigm="sin-cos" m={2} n={3} />)
    expect(document.body.textContent).toMatch(/sin\^2|cos\^3|≈/i)
  })

  it('renders with m=1 n=1 (both odd) showing u-sub strategy', () => {
    expect(() =>
      render(<TrigIntegralsScene paradigm="sin-cos" m={1} n={1} />)
    ).not.toThrow()
  })

  it('renders with m=2 n=2 (both even) showing half-angle strategy', () => {
    expect(() =>
      render(<TrigIntegralsScene paradigm="sin-cos" m={2} n={2} />)
    ).not.toThrow()
  })

  it('renders with large exponents m=7 n=7 without throwing', () => {
    expect(() =>
      render(<TrigIntegralsScene paradigm="sin-cos" m={7} n={7} />)
    ).not.toThrow()
  })
})
