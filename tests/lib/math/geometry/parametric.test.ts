import { describe, it, expect } from 'vitest'
import { parametricCurvePoints } from '@/lib/math/geometry/parametric'

describe('parametricCurvePoints', () => {
  it('x=cos(t),y=sin(t) traces unit circle', () => {
    const pts = parametricCurvePoints('cos(t)', 'sin(t)', 0, 2 * Math.PI, 360)
    expect(pts.length).toBe(360)
    const maxR = Math.max(...pts.map((p) => Math.sqrt(p.x ** 2 + p.y ** 2)))
    expect(maxR).toBeCloseTo(1, 1)
  })

  it('x=t,y=t traces y=x line', () => {
    const pts = parametricCurvePoints('t', 't', 0, 5, 50)
    for (const p of pts) {
      expect(p.x).toBeCloseTo(p.y, 5)
    }
  })

  it('returns empty array when x expression is invalid', () => {
    const pts = parametricCurvePoints('2t', 'sin(t)', 0, 6, 50)
    expect(pts).toEqual([])
  })

  it('returns empty array when y expression is invalid', () => {
    const pts = parametricCurvePoints('cos(t)', '2t', 0, 6, 50)
    expect(pts).toEqual([])
  })

  it('t values stored correctly', () => {
    const pts = parametricCurvePoints('cos(t)', 'sin(t)', 0, Math.PI, 10)
    expect(pts[0].t).toBeCloseTo(0, 5)
    expect(pts[9].t).toBeCloseTo(Math.PI, 1)
  })
})
