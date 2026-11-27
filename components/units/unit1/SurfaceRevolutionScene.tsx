'use client'

import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { parseExpression } from '@/lib/math/parser'

type SRParadigm = 'x-axis' | 'y-axis'

export interface SurfaceRevolutionSceneProps {
  paradigm: SRParadigm
  fn: string
  a: number
  b: number
}

// ── Numerical derivative ────────────────────────────────────────────────────

function deriv(f: (x: number) => number, x: number, h = 1e-5): number {
  return (f(x + h) - f(x - h)) / (2 * h)
}

// ── Surface area estimate ───────────────────────────────────────────────────

function computeSurfaceArea(
  paradigm: SRParadigm,
  f: (x: number) => number,
  a: number,
  b: number,
  n = 400,
): number {
  if (b <= a) return 0
  const dx = (b - a) / n
  let sum = 0
  for (let i = 0; i < n; i++) {
    const x = a + (i + 0.5) * dx
    const fx = Math.max(0, f(x))
    const fpx = deriv(f, x)
    const ds = Math.sqrt(1 + fpx * fpx)
    sum += paradigm === 'x-axis' ? fx * ds : x * ds
  }
  return 2 * Math.PI * sum * dx
}

// ── Build surface of revolution geometry ──────────────────────────────────

function buildSurfaceGeometry(
  paradigm: SRParadigm,
  f: (x: number) => number,
  a: number,
  b: number,
  nX = 160,
  nTheta = 48,
  rMax = 3,
): THREE.BufferGeometry {
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= nX; i++) {
    const t = i / nX
    const x = a + t * (b - a)
    const rawR = f(x)
    const r = Math.max(0, Math.min(isFinite(rawR) ? rawR : 0, rMax))

    for (let j = 0; j <= nTheta; j++) {
      const theta = (j / nTheta) * Math.PI * 2
      const cosT = Math.cos(theta)
      const sinT = Math.sin(theta)

      if (paradigm === 'x-axis') {
        // revolve around x-axis: (x, r·cos θ, r·sin θ)
        positions.push(x, r * cosT, r * sinT)
        normals.push(0, cosT, sinT)
      } else {
        // revolve around y-axis: (r·cos θ, f(r), r·sin θ) where r = x
        // point (x, f(x)) rotated around y-axis
        positions.push(r * cosT, x, r * sinT)
        normals.push(cosT, 0, sinT)
      }
    }
  }

  for (let i = 0; i < nX; i++) {
    for (let j = 0; j < nTheta; j++) {
      const a0 = i * (nTheta + 1) + j
      const b0 = a0 + 1
      const c0 = a0 + (nTheta + 1)
      const d0 = c0 + 1
      indices.push(a0, c0, b0)
      indices.push(b0, c0, d0)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setIndex(indices)
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  return geo
}

// ── Band ring (highlight strip at a fixed x) ──────────────────────────────

function BandRing({
  paradigm,
  x,
  r,
  color,
}: {
  paradigm: SRParadigm
  x: number
  r: number
  color: string
}) {
  const pts = useMemo((): [number, number, number][] => {
    const N = 64
    return Array.from({ length: N + 1 }, (_, i) => {
      const theta = (i / N) * Math.PI * 2
      if (paradigm === 'x-axis') return [x, r * Math.cos(theta), r * Math.sin(theta)]
      return [r * Math.cos(theta), x, r * Math.sin(theta)]
    })
  }, [paradigm, x, r])

  return <Line points={pts} color={color} lineWidth={1.5} />
}

// ── Profile silhouette ────────────────────────────────────────────────────

function ProfileSilhouette({
  paradigm,
  f,
  a,
  b,
  color,
}: {
  paradigm: SRParadigm
  f: (x: number) => number
  a: number
  b: number
  color: string
}) {
  const N = 200
  const rMax = 3

  const topPts = useMemo((): [number, number, number][] => {
    const pts: [number, number, number][] = []
    for (let i = 0; i <= N; i++) {
      const x = a + (i / N) * (b - a)
      const r = Math.min(Math.max(0, isFinite(f(x)) ? f(x) : 0), rMax)
      if (paradigm === 'x-axis') pts.push([x, r, 0])
      else pts.push([r, x, 0])
    }
    return pts
  }, [paradigm, f, a, b])

  const shadedGeo = useMemo(() => {
    const shape = new THREE.Shape()
    if (paradigm === 'x-axis') {
      shape.moveTo(a, 0)
      for (let i = 0; i <= N; i++) {
        const x = a + (i / N) * (b - a)
        const r = Math.min(Math.max(0, isFinite(f(x)) ? f(x) : 0), rMax)
        shape.lineTo(x, r)
      }
      shape.lineTo(b, 0)
    } else {
      shape.moveTo(0, a)
      for (let i = 0; i <= N; i++) {
        const x = a + (i / N) * (b - a)
        const r = Math.min(Math.max(0, isFinite(f(x)) ? f(x) : 0), rMax)
        shape.lineTo(r, x)
      }
      shape.lineTo(0, b)
    }
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  }, [paradigm, f, a, b])

  useEffect(() => () => shadedGeo.dispose(), [shadedGeo])

  return (
    <>
      <Line points={topPts} color={color} lineWidth={2.5} />
      <mesh geometry={shadedGeo} position={[0, 0, 0.01]}>
        <meshBasicMaterial color={color} transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </>
  )
}

// ── Surface mesh ──────────────────────────────────────────────────────────

function SurfaceMesh({
  paradigm,
  f,
  a,
  b,
}: {
  paradigm: SRParadigm
  f: (x: number) => number
  a: number
  b: number
}) {
  const geo = useMemo(
    () => buildSurfaceGeometry(paradigm, f, a, b),
    [paradigm, f, a, b]
  )
  useEffect(() => () => geo.dispose(), [geo])

  return (
    <>
      <mesh geometry={geo}>
        <meshStandardMaterial
          color="#6366f1"
          transparent
          opacity={0.65}
          side={THREE.FrontSide}
          metalness={0.15}
          roughness={0.35}
        />
      </mesh>
      <mesh geometry={geo}>
        <meshStandardMaterial
          color="#6366f1"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  )
}

// ── Main scene content ────────────────────────────────────────────────────

function SRContent({ paradigm, fn, a, b }: SurfaceRevolutionSceneProps) {
  const parsed = useMemo(() => parseExpression(fn, ['x']), [fn])
  const f = useMemo(
    () => (x: number) => (parsed.valid && parsed.fn ? parsed.fn({ x }) : 0),
    [parsed]
  )

  const aMin = Math.min(a, b)
  const bMax = Math.max(a, b)

  const surfaceArea = useMemo(
    () => computeSurfaceArea(paradigm, f, aMin, bMax),
    [paradigm, f, aMin, bMax]
  )

  // Band rings at regular intervals
  const nBands = 8
  const bandXs = useMemo(
    () => Array.from({ length: nBands }, (_, i) => aMin + ((i + 0.5) / nBands) * (bMax - aMin)),
    [aMin, bMax]
  )

  const rMax = 3
  const axisEnd = paradigm === 'x-axis' ? bMax + 0.5 : bMax + 0.5

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} />
      <directionalLight position={[-5, -4, -3]} intensity={0.4} />

      {/* 3D surface */}
      {aMin < bMax && <SurfaceMesh paradigm={paradigm} f={f} a={aMin} b={bMax} />}

      {/* Profile silhouette */}
      {aMin < bMax && (
        <ProfileSilhouette paradigm={paradigm} f={f} a={aMin} b={bMax} color="#818cf8" />
      )}

      {/* Band rings */}
      {bandXs.map((x, i) => {
        const r = Math.min(Math.max(0, isFinite(f(x)) ? f(x) : 0), rMax)
        return <BandRing key={i} paradigm={paradigm} x={x} r={r} color="#f59e0b" />
      })}

      {/* Rotation axis */}
      {paradigm === 'x-axis' ? (
        <Line
          points={[[-0.3, 0, 0], [bMax + 0.6, 0, 0]] as [number, number, number][]}
          color="#6b7280"
          lineWidth={1}
        />
      ) : (
        <Line
          points={[[0, -0.3, 0], [0, bMax + 0.6, 0]] as [number, number, number][]}
          color="#6b7280"
          lineWidth={1}
        />
      )}

      {/* Surface area label */}
      <Html position={paradigm === 'x-axis' ? [(aMin + bMax) / 2, rMax + 0.4, 0] : [rMax + 0.4, (aMin + bMax) / 2, 0]}>
        <div style={{ textAlign: 'center', pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{ color: '#9ca3af', fontSize: 10, marginBottom: 2 }}>
            {paradigm === 'x-axis'
              ? `S = 2π∫f(x)√(1+f'²) dx`
              : `S = 2π∫x√(1+f'²) dx`}
          </div>
          <div style={{ color: '#a5b4fc', fontSize: 13, fontWeight: 700 }}>
            S ≈ {surfaceArea.toFixed(3)}
          </div>
        </div>
      </Html>

      {/* Axis labels */}
      <Html position={paradigm === 'x-axis' ? [bMax + 0.7, 0, 0] : [0, bMax + 0.7, 0]}>
        <div style={{ color: '#6b7280', fontSize: 11, pointerEvents: 'none', userSelect: 'none' }}>
          {paradigm === 'x-axis' ? 'x' : 'y'}
        </div>
      </Html>
      <Html position={paradigm === 'x-axis' ? [aMin, -0.3, 0] : [-0.3, aMin, 0]}>
        <div style={{ color: '#9ca3af', fontSize: 10, pointerEvents: 'none', userSelect: 'none' }}>a</div>
      </Html>
      <Html position={paradigm === 'x-axis' ? [bMax, -0.3, 0] : [-0.3, bMax, 0]}>
        <div style={{ color: '#9ca3af', fontSize: 10, pointerEvents: 'none', userSelect: 'none' }}>b</div>
      </Html>
    </>
  )
}

// ── Public component ──────────────────────────────────────────────────────

export function SurfaceRevolutionScene({ paradigm, fn, a, b }: SurfaceRevolutionSceneProps) {
  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [4, 3, 8], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <SRContent paradigm={paradigm} fn={fn} a={a} b={b} />
      <OrbitControls makeDefault />
    </Canvas>
  )
}
