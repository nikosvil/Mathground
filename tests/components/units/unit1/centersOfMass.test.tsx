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

import { CentersOfMassScene } from '@/components/units/unit1/CentersOfMassScene'

describe('CentersOfMassScene', () => {
  it('renders region paradigm without throwing', () => {
    expect(() =>
      render(<CentersOfMassScene paradigm="region" fn="sqrt(x)" a={0} b={4} rho={1} />)
    ).not.toThrow()
  })

  it('region scene has a canvas', () => {
    render(<CentersOfMassScene paradigm="region" fn="sqrt(x)" a={0} b={4} rho={1} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders variable-density paradigm without throwing', () => {
    expect(() =>
      render(<CentersOfMassScene paradigm="variable-density" fn="1 + x/3" a={0} b={3} rho={1} />)
    ).not.toThrow()
  })

  it('variable-density scene has a canvas', () => {
    render(<CentersOfMassScene paradigm="variable-density" fn="1 + x/3" a={0} b={3} rho={1} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('displays centroid label', () => {
    render(<CentersOfMassScene paradigm="region" fn="sqrt(x)" a={0} b={4} rho={1} />)
    expect(document.body.textContent).toMatch(/x̄|CoM/i)
  })

  it('handles rho=3 without throwing', () => {
    expect(() =>
      render(<CentersOfMassScene paradigm="region" fn="x^2" a={0} b={2} rho={3} />)
    ).not.toThrow()
  })

  it('handles a=b edge case without crashing', () => {
    expect(() =>
      render(<CentersOfMassScene paradigm="region" fn="x" a={2} b={2} rho={1} />)
    ).not.toThrow()
  })

  it('handles f(x)=0 (zero area region) without crashing', () => {
    expect(() =>
      render(<CentersOfMassScene paradigm="region" fn="0" a={0} b={3} rho={1} />)
    ).not.toThrow()
  })
})
