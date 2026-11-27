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
    CircleGeometry: vi.fn().mockImplementation(() => ({
      rotateY: vi.fn().mockReturnThis(),
      dispose: vi.fn(),
    })),
    ShapeGeometry: vi.fn().mockImplementation(() => ({ dispose: vi.fn() })),
    Shape: vi.fn().mockImplementation(() => ({
      moveTo: vi.fn().mockReturnThis(),
      lineTo: vi.fn().mockReturnThis(),
      closePath: vi.fn().mockReturnThis(),
    })),
  }
})

import { SurfaceRevolutionScene } from '@/components/units/unit1/SurfaceRevolutionScene'

describe('SurfaceRevolutionScene', () => {
  it('renders x-axis paradigm without throwing', () => {
    expect(() =>
      render(<SurfaceRevolutionScene paradigm="x-axis" fn="sqrt(x)" a={0} b={4} />)
    ).not.toThrow()
  })

  it('x-axis scene has a canvas', () => {
    render(<SurfaceRevolutionScene paradigm="x-axis" fn="sqrt(x)" a={0} b={4} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders y-axis paradigm without throwing', () => {
    expect(() =>
      render(<SurfaceRevolutionScene paradigm="y-axis" fn="x^2" a={0} b={2} />)
    ).not.toThrow()
  })

  it('y-axis scene has a canvas', () => {
    render(<SurfaceRevolutionScene paradigm="y-axis" fn="x^2" a={0} b={2} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('displays surface area label', () => {
    render(<SurfaceRevolutionScene paradigm="x-axis" fn="sqrt(x)" a={0} b={4} />)
    expect(document.body.textContent).toMatch(/S\s*=|Surface Area/i)
  })

  it('handles constant function without throwing', () => {
    expect(() =>
      render(<SurfaceRevolutionScene paradigm="x-axis" fn="2" a={0} b={3} />)
    ).not.toThrow()
  })

  it('handles a=b edge case without throwing', () => {
    expect(() =>
      render(<SurfaceRevolutionScene paradigm="x-axis" fn="x" a={1} b={1} />)
    ).not.toThrow()
  })
})
