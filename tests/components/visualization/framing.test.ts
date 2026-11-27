import { describe, it, expect } from 'vitest'
import { fitDistance, needsRefit } from '@/components/visualization/framing'

describe('fitDistance', () => {
  it('places a unit sphere fully in a 90° square view at √2', () => {
    expect(fitDistance(1, 90, 1, 1)).toBeCloseTo(Math.SQRT2)
  })

  it('scales linearly with the sphere radius', () => {
    expect(fitDistance(3, 40, 1.6, 1.2)).toBeCloseTo(3 * fitDistance(1, 40, 1.6, 1.2))
  })

  it('backs off further in a portrait viewport, where the horizontal fov is the tighter one', () => {
    expect(fitDistance(1, 40, 0.5, 1)).toBeGreaterThan(fitDistance(1, 40, 1.5, 1))
  })
})

describe('needsRefit', () => {
  it('keeps the camera still for small size changes while a slider is dragged', () => {
    expect(needsRefit(2, 2.3)).toBe(false)
  })

  it('refits when the object outgrows the view or shrinks to a speck', () => {
    expect(needsRefit(2, 3)).toBe(true)
    expect(needsRefit(2, 1)).toBe(true)
  })
})
