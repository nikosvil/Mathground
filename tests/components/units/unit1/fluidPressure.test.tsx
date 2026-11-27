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

import { FluidPressureScene } from '@/components/units/unit1/FluidPressureScene'

describe('FluidPressureScene', () => {
  it('renders flat-plate paradigm without throwing', () => {
    expect(() =>
      render(<FluidPressureScene paradigm="flat-plate" depth={4} width={3} h={4} />)
    ).not.toThrow()
  })

  it('flat-plate scene has a canvas', () => {
    render(<FluidPressureScene paradigm="flat-plate" depth={4} width={3} h={4} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders submerged paradigm without throwing', () => {
    expect(() =>
      render(<FluidPressureScene paradigm="submerged" depth={2} width={3} h={3} />)
    ).not.toThrow()
  })

  it('submerged scene has a canvas', () => {
    render(<FluidPressureScene paradigm="submerged" depth={2} width={3} h={3} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('displays force value label', () => {
    render(<FluidPressureScene paradigm="flat-plate" depth={4} width={3} h={4} />)
    expect(document.body.textContent).toMatch(/F\s*=|force|pressure/i)
  })

  it('handles maximum depth without throwing', () => {
    expect(() =>
      render(<FluidPressureScene paradigm="flat-plate" depth={10} width={8} h={10} />)
    ).not.toThrow()
  })

  it('handles depth=0 edge case without crashing', () => {
    expect(() =>
      render(<FluidPressureScene paradigm="flat-plate" depth={0} width={3} h={3} />)
    ).not.toThrow()
  })
})
