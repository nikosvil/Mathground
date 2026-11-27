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

import { FunctionPlot2D } from '@/components/units/unit2/FunctionPlot2D'
import { NumericalIntegrationScene } from '@/components/units/unit2/NumericalIntegrationScene'
import { IntegrationByPartsScene } from '@/components/units/unit2/IntegrationByPartsScene'
import { TrigSubstitutionScene } from '@/components/units/unit2/TrigSubstitutionScene'
import { PartialFractionsScene } from '@/components/units/unit2/PartialFractionsScene'
import { ImproperIntegralsScene } from '@/components/units/unit2/ImproperIntegralsScene'

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

describe('IntegrationByPartsScene', () => {
  it('renders geometric view without throwing', () => {
    expect(() =>
      render(<IntegrationByPartsScene paradigm="geometric" a={0} b={2} />)
    ).not.toThrow()
  })

  it('geometric view has a canvas', () => {
    render(<IntegrationByPartsScene paradigm="geometric" a={0} b={2} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders tabular view without throwing', () => {
    expect(() =>
      render(<IntegrationByPartsScene paradigm="tabular" a={0} b={2} steps={3} />)
    ).not.toThrow()
  })

  it('tabular view shows IBP table content', () => {
    render(<IntegrationByPartsScene paradigm="tabular" a={0} b={2} steps={3} />)
    expect(document.body.textContent).toContain('eˣ')
  })

  it('renders with different a/b values', () => {
    expect(() =>
      render(<IntegrationByPartsScene paradigm="geometric" a={1} b={3} />)
    ).not.toThrow()
  })
})

describe('TrigSubstitutionScene', () => {
  it('renders a2-x2 paradigm without throwing', () => {
    expect(() =>
      render(<TrigSubstitutionScene paradigm="a2-x2" a={2} x={0.5} />)
    ).not.toThrow()
  })

  it('a2-x2 scene has a canvas', () => {
    render(<TrigSubstitutionScene paradigm="a2-x2" a={2} x={1} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders a2+x2 paradigm without throwing', () => {
    expect(() =>
      render(<TrigSubstitutionScene paradigm="a2+x2" a={2} x={1} />)
    ).not.toThrow()
  })

  it('renders x2-a2 paradigm without throwing', () => {
    expect(() =>
      render(<TrigSubstitutionScene paradigm="x2-a2" a={1} x={2} />)
    ).not.toThrow()
  })

  it('handles edge case x=0 without throwing', () => {
    expect(() =>
      render(<TrigSubstitutionScene paradigm="a2-x2" a={2} x={0} />)
    ).not.toThrow()
  })
})

describe('PartialFractionsScene', () => {
  it('renders distinct-roots paradigm without throwing', () => {
    expect(() =>
      render(<PartialFractionsScene paradigm="distinct-roots" a={-2} b={3} />)
    ).not.toThrow()
  })

  it('distinct-roots scene has a canvas', () => {
    render(<PartialFractionsScene paradigm="distinct-roots" a={-2} b={3} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders repeated-root paradigm without throwing', () => {
    expect(() =>
      render(<PartialFractionsScene paradigm="repeated-root" a={1} />)
    ).not.toThrow()
  })

  it('renders irreducible-quadratic paradigm without throwing', () => {
    expect(() =>
      render(<PartialFractionsScene paradigm="irreducible-quadratic" a={1} b={0} c={1} />)
    ).not.toThrow()
  })

  it('handles poles coinciding with x=0 without throwing', () => {
    expect(() =>
      render(<PartialFractionsScene paradigm="distinct-roots" a={-1} b={1} />)
    ).not.toThrow()
  })
})

describe('ImproperIntegralsScene', () => {
  it('renders infinite-bound paradigm without throwing', () => {
    expect(() =>
      render(<ImproperIntegralsScene paradigm="infinite-bound" p={2} B={20} />)
    ).not.toThrow()
  })

  it('infinite-bound scene has a canvas', () => {
    render(<ImproperIntegralsScene paradigm="infinite-bound" p={2} B={20} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders vertical-asymptote paradigm without throwing', () => {
    expect(() =>
      render(<ImproperIntegralsScene paradigm="vertical-asymptote" p={0.5} eps={0.1} />)
    ).not.toThrow()
  })

  it('handles p=1 boundary case without throwing', () => {
    expect(() =>
      render(<ImproperIntegralsScene paradigm="infinite-bound" p={1} B={50} />)
    ).not.toThrow()
  })

  it('handles p>1 (converges) and p<1 (diverges) without throwing', () => {
    expect(() =>
      render(<ImproperIntegralsScene paradigm="vertical-asymptote" p={1.5} eps={0.01} />)
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
