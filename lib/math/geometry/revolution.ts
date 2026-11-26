import * as THREE from 'three'

type Fn = (scope: Record<string, number>) => number

function clamp(v: number): number {
  if (!isFinite(v) || isNaN(v)) return 0
  return Math.max(-1000, Math.min(1000, v))
}

export function diskGeometry(
  fn: Fn,
  xMin: number,
  xMax: number,
  segments: number,
  axis: 'x' | 'y' = 'x',
  axisOffset: number = 0
): THREE.BufferGeometry {
  const positions: number[] = []
  const indices: number[] = []
  const radialSegments = 32
  const dx = (xMax - xMin) / segments

  for (let i = 0; i <= segments; i++) {
    const x = xMin + i * dx
    const r = Math.abs(clamp(fn({ x })) - axisOffset)

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * 2 * Math.PI
      if (axis === 'x') {
        positions.push(x, r * Math.cos(theta), r * Math.sin(theta))
      } else {
        positions.push(r * Math.cos(theta), x, r * Math.sin(theta))
      }
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j
      const b = a + radialSegments + 1
      indices.push(a, b, a + 1)
      indices.push(b, b + 1, a + 1)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(indices)
  return geo
}

export function washerGeometry(
  outerFn: Fn,
  innerFn: Fn,
  xMin: number,
  xMax: number,
  segments: number
): THREE.BufferGeometry {
  const positions: number[] = []
  const indices: number[] = []
  const radialSegments = 32
  const dx = (xMax - xMin) / segments

  for (let i = 0; i <= segments; i++) {
    const x = xMin + i * dx
    const scope = { x }
    const rOuter = Math.abs(clamp(outerFn(scope)))
    const rInner = Math.abs(clamp(innerFn(scope)))

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * 2 * Math.PI
      const cos = Math.cos(theta)
      const sin = Math.sin(theta)
      // outer ring
      positions.push(x, rOuter * cos, rOuter * sin)
      // inner ring
      positions.push(x, rInner * cos, rInner * sin)
    }
  }

  const stride = (radialSegments + 1) * 2
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const outerA = i * stride + j * 2
      const outerB = outerA + stride
      const innerA = outerA + 1
      const innerB = outerB + 1

      // outer quad
      indices.push(outerA, outerB, outerA + 2)
      indices.push(outerB, outerB + 2, outerA + 2)

      // inner quad (reversed winding)
      indices.push(innerA, innerA + 2, innerB)
      indices.push(innerB, innerA + 2, innerB + 2)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(indices)
  return geo
}

export function shellGeometry(
  fn: Fn,
  xMin: number,
  xMax: number,
  segments: number
): THREE.BufferGeometry {
  const positions: number[] = []
  const indices: number[] = []
  const radialSegments = 32
  const dx = (xMax - xMin) / segments

  for (let i = 0; i <= segments; i++) {
    const x = xMin + i * dx
    const h = clamp(fn({ x }))
    const r = Math.abs(x)

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * 2 * Math.PI
      const cos = Math.cos(theta)
      const sin = Math.sin(theta)
      // bottom of shell
      positions.push(r * cos, 0, r * sin)
      // top of shell
      positions.push(r * cos, h, r * sin)
    }
  }

  const stride = (radialSegments + 1) * 2
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * stride + j * 2
      const b = a + stride
      // vertical quad on the cylinder surface
      indices.push(a, b, a + 2)
      indices.push(b, b + 2, a + 2)
      // top ring
      indices.push(a + 1, a + 3, b + 1)
      indices.push(b + 1, a + 3, b + 3)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(indices)
  return geo
}

export function diskVolumeNumerical(
  fn: Fn,
  xMin: number,
  xMax: number,
  n: number
): { volume: number } {
  const dx = (xMax - xMin) / n
  let sum = 0
  for (let i = 0; i < n; i++) {
    const x = xMin + (i + 0.5) * dx
    const r = fn({ x })
    if (isFinite(r)) {
      sum += r * r
    }
  }
  return { volume: Math.PI * sum * dx }
}
