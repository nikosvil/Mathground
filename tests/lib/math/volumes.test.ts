import { describe, it, expect } from 'vitest'
import { slices, riemannVolume, exactVolume, latheProfile, regionOutline, solidBounds } from '@/lib/math/volumes'

const PI = Math.PI

describe('exactVolume', () => {
  it('disk: y = √x on [0,4] about the x-axis is 8π (Thomas §6.2 Ex. 2)', () => {
    expect(exactVolume({ method: 'disk', f: Math.sqrt, a: 0, b: 4 })).toBeCloseTo(8 * PI, 3)
  })

  it('washer: region between y = x and y = x² on [0,1] is 2π/15', () => {
    expect(exactVolume({ method: 'washer', f: x => x, g: x => x * x, a: 0, b: 1 })).toBeCloseTo((2 * PI) / 15, 4)
  })

  it('washer: swapping outer and inner curves gives the same volume', () => {
    const v1 = exactVolume({ method: 'washer', f: x => x, g: x => x * x, a: 0, b: 1 })
    const v2 = exactVolume({ method: 'washer', f: x => x * x, g: x => x, a: 0, b: 1 })
    expect(v2).toBeCloseTo(v1, 6)
  })

  it('shell: y = 3x − x² on [0,3] about the y-axis is 27π/2', () => {
    expect(exactVolume({ method: 'shell', f: x => 3 * x - x * x, a: 0, b: 3 })).toBeCloseTo(13.5 * PI, 3)
  })

  it('disk about a shifted axis y = k uses radius |f − k|', () => {
    expect(exactVolume({ method: 'disk', f: () => 1, a: 0, b: 2, k: -1 })).toBeCloseTo(8 * PI, 6)
  })

  it('treats non-finite function values as zero instead of returning NaN', () => {
    expect(Number.isFinite(exactVolume({ method: 'disk', f: x => 1 / x, a: 0, b: 1 }))).toBe(true)
  })
})

describe('riemannVolume', () => {
  it('midpoint disks are exact when R² is linear: √x on [0,4] with n = 4 is 8π', () => {
    expect(riemannVolume({ method: 'disk', f: Math.sqrt, a: 0, b: 4 }, 4)).toBeCloseTo(8 * PI, 10)
  })

  it('converges to the exact volume as n grows', () => {
    const spec = { method: 'disk' as const, f: (x: number) => Math.exp(x / 2), a: 0, b: 2 }
    const exact = exactVolume(spec)
    const err5 = Math.abs(riemannVolume(spec, 5) - exact)
    const err50 = Math.abs(riemannVolume(spec, 50) - exact)
    expect(err50).toBeLessThan(err5 / 50)
  })
})

describe('slices', () => {
  it('returns n contiguous slices covering [a, b]', () => {
    const s = slices({ method: 'disk', f: Math.sqrt, a: 0, b: 4 }, 8)
    expect(s).toHaveLength(8)
    expect(s[0].x0).toBe(0)
    expect(s[7].x1).toBeCloseTo(4)
    for (let i = 1; i < 8; i++) expect(s[i].x0).toBeCloseTo(s[i - 1].x1)
  })

  it('disk slices have zero inner radius and midpoint outer radius', () => {
    const [first] = slices({ method: 'disk', f: Math.sqrt, a: 0, b: 4 }, 4)
    expect(first.rIn).toBe(0)
    expect(first.rOut).toBeCloseTo(Math.sqrt(0.5))
  })

  it('shell slices span radius [x0, x1] with height f(midpoint)', () => {
    const [first] = slices({ method: 'shell', f: x => 3 * x - x * x, a: 0, b: 3 }, 3)
    expect(first.rIn).toBe(0)
    expect(first.rOut).toBe(1)
    expect(first.height).toBeCloseTo(3 * 0.5 - 0.25)
  })

  it('returns no slices for an empty interval', () => {
    expect(slices({ method: 'disk', f: Math.sqrt, a: 2, b: 2 }, 5)).toHaveLength(0)
  })
})

describe('latheProfile', () => {
  it('disk profile starts and ends on the axis so the solid has end caps', () => {
    const p = latheProfile({ method: 'disk', f: Math.sqrt, a: 1, b: 4 }, 16)
    expect(p[0]).toEqual([0, 1])
    expect(p[p.length - 1]).toEqual([0, 4])
    expect(p[1][0]).toBeCloseTo(1)
  })

  it('never produces a negative radius', () => {
    const p = latheProfile({ method: 'washer', f: x => -x, g: x => -2 * x, a: 0, b: 1 }, 16)
    expect(p.every(([r]) => r >= 0)).toBe(true)
  })
})

describe('regionOutline', () => {
  it('disk region runs along the axis y = k then back along the curve', () => {
    const o = regionOutline({ method: 'disk', f: Math.sqrt, a: 0, b: 4, k: 0 }, 4)
    expect(o[0]).toEqual([0, 0])
    expect(o.some(([x, y]) => x === 4 && Math.abs(y - 2) < 1e-9)).toBe(true)
  })
})

describe('solidBounds', () => {
  it('disk about the x-axis is symmetric in y and z with the max radius', () => {
    const b = solidBounds({ method: 'disk', f: Math.sqrt, a: 0, b: 4 })
    expect(b.min[0]).toBe(0)
    expect(b.max[0]).toBe(4)
    expect(b.max[1]).toBeCloseTo(2, 2)
    expect(b.min[2]).toBeCloseTo(-2, 2)
  })

  it('shell about the y-axis spans ±max|x| horizontally and the curve vertically', () => {
    const b = solidBounds({ method: 'shell', f: x => 3 * x - x * x, a: 0, b: 3 })
    expect(b.max[0]).toBe(3)
    expect(b.min[2]).toBe(-3)
    expect(b.min[1]).toBe(0)
    expect(b.max[1]).toBeCloseTo(2.25, 2)
  })
})
