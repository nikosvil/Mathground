import { describe, it, expect } from 'vitest'
import { polarCurvePoints } from '@/lib/math/geometry/polar'

describe('polarCurvePoints', () => {
  it('r=1 produces unit circle', () => {
    const pts = polarCurvePoints('1', 0, 2 * Math.PI, 360)
    expect(pts.length).toBe(360)
    const xs = pts.map((p) => p.x)
    expect(Math.max(...xs)).toBeCloseTo(1, 1)
    expect(Math.min(...xs)).toBeCloseTo(-1, 1)
  })

  it('cardioid r=1+cos(θ) has correct x range', () => {
    const pts = polarCurvePoints('1 + cos(θ)', 0, 2 * Math.PI, 360)
    expect(pts.length).toBeGreaterThan(0)
    const xs = pts.map((p) => p.x)
    // max x should be near 2 (at θ=0, r=2)
    expect(Math.max(...xs)).toBeCloseTo(2, 0)
  })

  it('returns empty array for invalid expression', () => {
    const pts = polarCurvePoints('2θ', 0, 2 * Math.PI, 100)
    expect(pts).toEqual([])
  })

  it('theta values stored correctly', () => {
    const pts = polarCurvePoints('1', 0, Math.PI, 10)
    expect(pts[0].theta).toBeCloseTo(0, 3)
    expect(pts[9].theta).toBeCloseTo(Math.PI, 1)
  })
})
