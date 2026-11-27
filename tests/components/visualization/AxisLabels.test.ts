import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { makeAxisGeometry } from '@/components/visualization/AxisLabels'

describe('makeAxisGeometry', () => {
  it('produces a real BufferAttribute the WebGL renderer can upload', () => {
    const geo = makeAxisGeometry([-3, 0, 0], [3, 0, 0])
    const pos = geo.getAttribute('position')

    expect(pos).toBeInstanceOf(THREE.BufferAttribute)
    expect(typeof (pos as THREE.BufferAttribute).onUploadCallback).toBe('function')
    expect(pos.count).toBe(2)
    expect(pos.getX(0)).toBe(-3)
    expect(pos.getX(1)).toBe(3)
  })

  it('supports bounding-sphere computation used for frustum culling', () => {
    const geo = makeAxisGeometry([0, -2, 0], [0, 2, 0])
    expect(() => geo.computeBoundingSphere()).not.toThrow()
    expect(geo.boundingSphere?.radius).toBeCloseTo(2)
  })
})
