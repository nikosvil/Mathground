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

// Mock the geometry functions since they use Three.js BufferGeometry
vi.mock('@/lib/math/geometry/revolution', () => ({
  diskGeometry: vi.fn().mockReturnValue({
    attributes: { position: { count: 100 } },
    setIndex: vi.fn(),
    setAttribute: vi.fn(),
  }),
  washerGeometry: vi.fn().mockReturnValue({
    attributes: { position: { count: 100 } },
    setIndex: vi.fn(),
    setAttribute: vi.fn(),
  }),
  shellGeometry: vi.fn().mockReturnValue({
    attributes: { position: { count: 100 } },
    setIndex: vi.fn(),
    setAttribute: vi.fn(),
  }),
  diskVolumeNumerical: vi.fn().mockReturnValue({ volume: Math.PI }),
}))

import { VolumesRevolutionScene } from '@/components/units/unit1/VolumesRevolutionScene'
import { VolumeFormulaDisplay } from '@/components/units/unit1/VolumeFormulaDisplay'
import { AreasBetweenCurvesScene } from '@/components/units/unit1/AreasBetweenCurvesScene'

describe('VolumesRevolutionScene', () => {
  it('renders without throwing for disk paradigm', () => {
    expect(() =>
      render(
        <VolumesRevolutionScene
          paradigm="disk"
          sliderValues={{ a: 0, b: 1, n: 20 }}
          fn="x^2"
        />
      )
    ).not.toThrow()
  })

  it('renders for washer paradigm', () => {
    expect(() =>
      render(
        <VolumesRevolutionScene
          paradigm="washer"
          sliderValues={{ a: 0, b: 1, n: 20 }}
          fn="x^2"
          innerFn="0.5*x"
        />
      )
    ).not.toThrow()
  })

  it('renders for shell paradigm', () => {
    expect(() =>
      render(
        <VolumesRevolutionScene
          paradigm="shell"
          sliderValues={{ a: 0, b: 1, n: 20 }}
          fn="x^2"
        />
      )
    ).not.toThrow()
  })
})

describe('VolumeFormulaDisplay', () => {
  it('shows computed volume for disk method', () => {
    render(
      <VolumeFormulaDisplay
        paradigm="disk"
        volume={Math.PI}
        fn="x^2"
        a={0}
        b={1}
      />
    )
    expect(screen.getByText(/volume/i)).toBeDefined()
    expect(screen.getAllByText(/π/i).length).toBeGreaterThan(0)
  })
})

describe('AreasBetweenCurvesScene', () => {
  it('renders without throwing', () => {
    expect(() =>
      render(<AreasBetweenCurvesScene fnTop="1" fnBottom="x^2" a={-1} b={1} />)
    ).not.toThrow()
  })

  it('canvas is present in the DOM', () => {
    render(<AreasBetweenCurvesScene fnTop="cos(x)" fnBottom="x/3 - 0.3" a={0} b={2} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('handles invalid expressions gracefully', () => {
    expect(() =>
      render(<AreasBetweenCurvesScene fnTop="2x" fnBottom="bad((" a={0} b={1} />)
    ).not.toThrow()
  })
})
