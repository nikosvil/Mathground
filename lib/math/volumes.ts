export type RevolutionMethod = 'disk' | 'washer' | 'shell'

export interface RevolutionSpec {
  method: RevolutionMethod
  f: (x: number) => number
  g?: (x: number) => number
  a: number
  b: number
  /** Disk/washer: revolve about the horizontal line y = k. */
  k?: number
}

/** Disk/washer: radii about the axis. Shell: rIn = x0, rOut = x1, height = f(xm). */
export interface Slice {
  x0: number
  x1: number
  xm: number
  rIn: number
  rOut: number
  height: number
}

export type Vec3 = [number, number, number]

const LIMIT = 1000

function safe(v: number): number {
  return Number.isFinite(v) ? Math.max(-LIMIT, Math.min(LIMIT, v)) : 0
}

function radii(spec: RevolutionSpec, x: number): { rIn: number; rOut: number } {
  const k = spec.k ?? 0
  const outer = Math.abs(safe(spec.f(x)) - k)
  if (spec.method !== 'washer') return { rIn: 0, rOut: outer }
  const inner = Math.abs(safe((spec.g ?? (() => k))(x)) - k)
  return { rIn: Math.min(inner, outer), rOut: Math.max(inner, outer) }
}

function samplePoints(a: number, b: number, samples: number): number[] {
  return Array.from({ length: samples + 1 }, (_, i) => a + ((b - a) * i) / samples)
}

export function slices(spec: RevolutionSpec, n: number): Slice[] {
  const count = Math.max(0, Math.round(n))
  const dx = (spec.b - spec.a) / count
  if (!(dx > 0)) return []
  return Array.from({ length: count }, (_, i) => {
    const x0 = spec.a + i * dx
    const x1 = i === count - 1 ? spec.b : x0 + dx
    const xm = (x0 + x1) / 2
    if (spec.method === 'shell') {
      return { x0, x1, xm, rIn: Math.abs(x0), rOut: Math.abs(x1), height: safe(spec.f(xm)) }
    }
    return { x0, x1, xm, ...radii(spec, xm), height: x1 - x0 }
  })
}

export function sliceVolume(s: Slice): number {
  const annulus = Math.PI * Math.abs(s.rOut * s.rOut - s.rIn * s.rIn)
  return annulus * Math.abs(s.height)
}

export function riemannVolume(spec: RevolutionSpec, n: number): number {
  return slices(spec, n).reduce((sum, s) => sum + sliceVolume(s), 0)
}

export function exactVolume(spec: RevolutionSpec): number {
  return riemannVolume(spec, 4000)
}

/** Closed profile [radius, axial] for THREE.LatheGeometry. */
export function latheProfile(spec: RevolutionSpec, samples: number): [number, number][] {
  const xs = samplePoints(spec.a, spec.b, samples)
  if (spec.method === 'shell') {
    const top = xs.slice().reverse().map(x => [Math.abs(x), safe(spec.f(x))] as [number, number])
    return [[Math.abs(spec.a), 0], [Math.abs(spec.b), 0], ...top, [Math.abs(spec.a), 0]]
  }
  if (spec.method === 'washer') {
    const outer = xs.map(x => [radii(spec, x).rOut, x] as [number, number])
    const inner = xs.slice().reverse().map(x => [radii(spec, x).rIn, x] as [number, number])
    return [...outer, ...inner, outer[0]]
  }
  return [[0, spec.a], ...xs.map(x => [radii(spec, x).rOut, x] as [number, number]), [0, spec.b]]
}

/** Polygon in the xy-plane: the 2D region that gets revolved. */
export function regionOutline(spec: RevolutionSpec, samples: number): [number, number][] {
  const xs = samplePoints(spec.a, spec.b, samples)
  const k = spec.k ?? 0
  const lower =
    spec.method === 'washer' && spec.g
      ? xs.map(x => [x, safe(spec.g!(x))] as [number, number])
      : xs.map(x => [x, spec.method === 'shell' ? 0 : k] as [number, number])
  const upper = xs.slice().reverse().map(x => [x, safe(spec.f(x))] as [number, number])
  return [...lower, ...upper]
}

export function solidBounds(spec: RevolutionSpec, samples = 200): { min: Vec3; max: Vec3 } {
  const xs = samplePoints(spec.a, spec.b, samples)
  if (spec.method === 'shell') {
    const R = Math.max(Math.abs(spec.a), Math.abs(spec.b))
    const ys = xs.map(x => safe(spec.f(x)))
    return { min: [-R, Math.min(0, ...ys), -R], max: [R, Math.max(0, ...ys), R] }
  }
  const k = spec.k ?? 0
  const R = Math.max(...xs.map(x => radii(spec, x).rOut))
  return { min: [spec.a, k - R, -R], max: [spec.b, k + R, R] }
}
