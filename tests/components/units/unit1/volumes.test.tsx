import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useThree: vi.fn().mockReturnValue({
    camera: { position: { set: vi.fn() }, lookAt: vi.fn() },
    size: { width: 800, height: 600 },
  }),
  useFrame: vi.fn(),
}))
vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  CameraControls: () => null,
  ContactShadows: () => null,
  Environment: () => null,
  Lightformer: () => null,
  Grid: () => null,
  Billboard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Text: () => null,
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
}))

import { VolumesRevolutionScene } from '@/components/units/unit1/VolumesRevolutionScene'
import { VolumeFormulaDisplay, volumeTex } from '@/components/units/unit1/VolumeFormulaDisplay'
import { AreasBetweenCurvesScene } from '@/components/units/unit1/AreasBetweenCurvesScene'

describe('VolumesRevolutionScene', () => {
  it('mounts a canvas for a valid function', () => {
    render(<VolumesRevolutionScene method="disk" fn="sqrt(x)" a={0} b={4} n={10} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('explains an unparseable function instead of showing a blank canvas', () => {
    render(<VolumesRevolutionScene method="disk" fn="sqrt((" a={0} b={4} n={10} />)
    expect(screen.getByText(/can't plot/i)).toBeDefined()
    expect(screen.queryByTestId('canvas')).toBeNull()
  })

  it('labels the axis of revolution, including a shifted axis', () => {
    render(<VolumesRevolutionScene method="disk" fn="sqrt(x)" a={0} b={4} n={10} k={-1} />)
    expect(screen.getByText('Revolving about y = -1')).toBeDefined()
  })
})

const tight = (s: string) => s.replace(/\s+/g, '')

describe('volumeTex', () => {
  it('disk: π∫ R(x)² with the function substituted', () => {
    const tex = tight(volumeTex('disk', 'sqrt(x)', undefined, 0, 0, 4))
    expect(tex).toContain('\\pi')
    expect(tex).toContain('\\sqrt{x}')
    expect(tex).toContain('_{0}^{4}')
  })

  it('disk about y = k subtracts k inside the radius', () => {
    expect(tight(volumeTex('disk', 'sqrt(x)', undefined, -1, 0, 4))).toContain('\\sqrt{x}+1')
  })

  it('washer: outer² − inner²', () => {
    const tex = volumeTex('washer', 'sqrt(x)+1', '0.6', 0, 0, 4)
    expect(tex).toContain('0.6')
    expect(tex).toContain('-')
  })

  it('shell: 2π∫ x·f(x)', () => {
    expect(volumeTex('shell', '3*x - x^2', undefined, 0, 0, 3)).toContain('2\\pi')
  })
})

describe('VolumeFormulaDisplay', () => {
  it('compares the n-slice Riemann sum with the exact integral', () => {
    render(
      <VolumeFormulaDisplay method="disk" fn="sqrt(x)" a={0} b={4} k={0} n={10} riemann={8 * Math.PI * 0.99} exact={8 * Math.PI} />,
    )
    expect(screen.getByText(/10 disks/i)).toBeDefined()
    expect(screen.getByText('8.000π')).toBeDefined()
    expect(screen.getByText(/1\.00% off/)).toBeDefined()
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
