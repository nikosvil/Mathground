import { describe, it, expect } from 'vitest'
import { taylorPoints, partialSumPoints } from '@/lib/math/geometry/series'

describe('series geometry', () => {
  it('taylorPoints for sin(x) degree 1 at x0=0 gives y≈x near 0', () => {
    const pts = taylorPoints('sin(x)', 0, 1, -1, 1, 100)
    expect(pts.length).toBeGreaterThan(0)
    const pt = pts.find((p) => Math.abs(p.x - 0.5) < 0.02)!
    expect(pt).toBeDefined()
    // degree-1 Taylor of sin at 0 is x; at x=0.5 → ≈0.5
    expect(pt.y).toBeCloseTo(0.5, 1)
  })

  it('taylorPoints for sin(x) degree 7 closely matches sin(x)', () => {
    const pts = taylorPoints('sin(x)', 0, 7, -3, 3, 200)
    // near x=1.5, degree-7 sin Taylor should be very accurate
    const pt = pts.find((p) => Math.abs(p.x - 1.5) < 0.05)!
    expect(pt).toBeDefined()
    expect(pt.y).toBeCloseTo(Math.sin(1.5), 1)
  })

  it('partialSumPoints for geometric series (a=0.5) converges to 2', () => {
    const pts = partialSumPoints((n) => Math.pow(0.5, n), 50)
    expect(pts).toHaveLength(50)
    expect(pts[49].partial).toBeCloseTo(2, 1)
  })

  it('partialSumPoints for a_n=1/n^2 converges to π²/6', () => {
    const pts = partialSumPoints((n) => 1 / (n * n), 1000)
    expect(pts[999].partial).toBeCloseTo(Math.PI ** 2 / 6, 1)
  })

  it('taylorPoints returns empty array for invalid expression', () => {
    const pts = taylorPoints('2x', 0, 3, -2, 2, 50)
    expect(pts).toEqual([])
  })
})
