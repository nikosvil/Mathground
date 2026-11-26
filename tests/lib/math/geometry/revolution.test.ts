import { describe, it, expect } from 'vitest'
import { diskGeometry, washerGeometry, shellGeometry, diskVolumeNumerical } from '@/lib/math/geometry/revolution'
import { parseExpression } from '@/lib/math/parser'

describe('revolution geometry', () => {
  it('diskGeometry for f(x)=1 on [0,1] has geometry positions', () => {
    const r = parseExpression('1', ['x'])
    expect(r.valid).toBe(true)
    const geo = diskGeometry(r.fn!, 0, 1, 20, 'x', 0)
    expect(geo.attributes.position.count).toBeGreaterThan(0)
  })

  it('diskVolumeNumerical for f(x)=1 on [0,1] ≈ π', () => {
    const r = parseExpression('1', ['x'])
    const { volume } = diskVolumeNumerical(r.fn!, 0, 1, 1000)
    expect(volume).toBeCloseTo(Math.PI, 1)
  })

  it('washerGeometry for outer=1, inner=0.5 on [0,1] has positions', () => {
    const outer = parseExpression('1', ['x']).fn!
    const inner = parseExpression('0.5', ['x']).fn!
    const geo = washerGeometry(outer, inner, 0, 1, 20)
    expect(geo.attributes.position.count).toBeGreaterThan(0)
  })

  it('shellGeometry for f(x)=x^2 on [0,1] has positions', () => {
    const r = parseExpression('x^2', ['x'])
    const geo = shellGeometry(r.fn!, 0, 1, 20)
    expect(geo.attributes.position.count).toBeGreaterThan(0)
  })

  it('diskGeometry clamps NaN vertices (1/x near 0) without throwing', () => {
    const r = parseExpression('1/x', ['x'])
    expect(r.valid).toBe(true)
    expect(() => diskGeometry(r.fn!, -1, 1, 50, 'x', 0)).not.toThrow()
  })

  it('diskVolumeNumerical for f(x)=x on [0,2] ≈ 8π/3', () => {
    const r = parseExpression('x', ['x'])
    const { volume } = diskVolumeNumerical(r.fn!, 0, 2, 1000)
    expect(volume).toBeCloseTo((8 * Math.PI) / 3, 1)
  })
})
