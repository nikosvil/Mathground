'use client'

import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { parseExpression } from '@/lib/math/parser'

export interface CentersOfMassSceneProps {
  paradigm: 'region' | 'variable-density'
  fn: string
  a: number
  b: number
  rho: number
}

type V3 = [number, number, number]

function integrate(f: (x: number) => number, a: number, b: number, steps = 800): number {
  if (b <= a) return 0
  const dx = (b - a) / steps
  let sum = 0
  for (let i = 0; i < steps; i++) {
    const v = f(a + (i + 0.5) * dx)
    sum += isFinite(v) ? v : 0
  }
  return sum * dx
}

// Gradient: indigo → amber
function lerpRGB(
  c0: [number, number, number],
  c1: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    c0[0] + (c1[0] - c0[0]) * t,
    c0[1] + (c1[1] - c0[1]) * t,
    c0[2] + (c1[2] - c0[2]) * t,
  ]
}

const INDIGO: [number, number, number] = [0.388, 0.4, 0.945]
const AMBER: [number, number, number] = [0.961, 0.620, 0.043]

// ── Region filled mesh (y=0 baseline → y=f(x) curve) ──────────────────────

function buildRegionGeometry(xs: number[], ys: number[]): THREE.BufferGeometry {
  const N = xs.length - 1
  const geo = new THREE.BufferGeometry()
  if (N < 1) return geo

  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []
  const range = xs[N] - xs[0]

  for (let i = 0; i <= N; i++) {
    const t = range > 0 ? (xs[i] - xs[0]) / range : 0
    const col = lerpRGB(INDIGO, AMBER, t)

    positions.push(xs[i], 0, 0)
    colors.push(col[0] * 0.5, col[1] * 0.5, col[2] * 0.5)

    positions.push(xs[i], ys[i], 0)
    colors.push(col[0], col[1], col[2])
  }

  for (let i = 0; i < N; i++) {
    const a = i * 2
    indices.push(a, a + 2, a + 1)
    indices.push(a + 1, a + 2, a + 3)
  }

  geo.setIndex(indices)
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return geo
}

// ── Density profile ribbon (height = ρ(x) / ρ_max · scale) ───────────────

function buildDensityGeometry(xs: number[], densities: number[], scale: number): THREE.BufferGeometry {
  const N = xs.length - 1
  const geo = new THREE.BufferGeometry()
  if (N < 1) return geo

  const dMax = densities.reduce((m, v) => Math.max(m, v), 0.001)
  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= N; i++) {
    const t = densities[i] / dMax
    const h = t * scale
    const col = lerpRGB(INDIGO, AMBER, t)

    positions.push(xs[i], 0, 0)
    colors.push(col[0] * 0.4, col[1] * 0.4, col[2] * 0.4)

    positions.push(xs[i], h, 0)
    colors.push(col[0], col[1], col[2])
  }

  for (let i = 0; i < N; i++) {
    const a = i * 2
    indices.push(a, a + 2, a + 1)
    indices.push(a + 1, a + 2, a + 3)
  }

  geo.setIndex(indices)
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return geo
}

function RegionMesh({ xs, ys }: { xs: number[]; ys: number[] }) {
  const geo = useMemo(() => buildRegionGeometry(xs, ys), [xs, ys])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.65}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

function DensityMesh({ xs, densities, scale }: { xs: number[]; densities: number[]; scale: number }) {
  const geo = useMemo(() => buildDensityGeometry(xs, densities, scale), [xs, densities, scale])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.75}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// ── Scene content ─────────────────────────────────────────────────────────

function CoMContent({ paradigm, fn, a, b, rho }: CentersOfMassSceneProps) {
  const aSafe = Math.min(a, b)
  const bSafe = Math.max(a, b)
  const rhoSafe = Math.max(0.1, rho)

  const N = 160

  const parsed = useMemo(() => parseExpression(fn, ['x']), [fn])
  const f = useMemo(() => (x: number): number => {
    if (!parsed.valid || !parsed.fn) return 0
    const v = parsed.fn({ x }) as number
    return isFinite(v) ? v : 0
  }, [parsed])

  const xs = useMemo(
    () => Array.from({ length: N + 1 }, (_, i) => aSafe + (i / N) * Math.max(bSafe - aSafe, 0.001)),
    [aSafe, bSafe],
  )

  // For 'region': ys = max(0, f(x)); for 'variable-density': ys = density profile height
  const DENSITY_SCALE = 2.2

  const ys = useMemo(() => xs.map(x => Math.max(0, f(x))), [xs, f])

  const densities = useMemo(
    () => (paradigm === 'variable-density' ? xs.map(x => Math.max(0, f(x))) : []),
    [paradigm, xs, f],
  )

  const { xBar, yBar, mass, bottomLabel } = useMemo(() => {
    if (paradigm === 'region') {
      const fFn = (x: number) => rhoSafe * Math.max(0, f(x))
      const mass = integrate(fFn, aSafe, bSafe)
      if (mass < 1e-10) {
        return { xBar: (aSafe + bSafe) / 2, yBar: 0, mass: 0, bottomLabel: 'M ≈ 0 (empty region)' }
      }
      const xBar = integrate(x => x * rhoSafe * Math.max(0, f(x)), aSafe, bSafe) / mass
      const yBar = integrate(x => 0.5 * rhoSafe * Math.max(0, f(x)) ** 2, aSafe, bSafe) / mass
      return {
        xBar,
        yBar,
        mass,
        bottomLabel: `x̄ = ${xBar.toFixed(3)},  ȳ = ${yBar.toFixed(3)}`,
      }
    } else {
      const rhoFn = (x: number) => Math.max(0, f(x))
      const mass = integrate(rhoFn, aSafe, bSafe)
      if (mass < 1e-10) {
        return { xBar: (aSafe + bSafe) / 2, yBar: 0, mass: 0, bottomLabel: 'M ≈ 0' }
      }
      const xBar = integrate(x => x * rhoFn(x), aSafe, bSafe) / mass
      return {
        xBar,
        yBar: 0,
        mass,
        bottomLabel: `x̄ = ${xBar.toFixed(3)},  M = ${mass.toFixed(3)}`,
      }
    }
  }, [paradigm, f, aSafe, bSafe, rhoSafe])

  const maxY = useMemo(
    () => (paradigm === 'region' ? ys.reduce((m, v) => Math.max(m, v), 0) : DENSITY_SCALE),
    [paradigm, ys],
  )

  const centroidSphereY = paradigm === 'region' ? yBar : DENSITY_SCALE * 0.5
  const centroidCrosshairY = paradigm === 'region' ? yBar : DENSITY_SCALE * 0.5

  const curvePoints = useMemo((): V3[] =>
    paradigm === 'region'
      ? xs.map((x, i) => [x, ys[i], 0] as V3)
      : xs.map((x, i) => {
          const h = densities.length > i ? (densities[i] / (densities.reduce((m, v) => Math.max(m, v), 0.001))) * DENSITY_SCALE : 0
          return [x, h, 0] as V3
        }),
    [paradigm, xs, ys, densities],
  )

  const midX = (aSafe + bSafe) / 2

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 5]} intensity={1.2} />
      <directionalLight position={[-3, -2, -3]} intensity={0.4} />

      {/* Filled region mesh */}
      {paradigm === 'region' && aSafe < bSafe && (
        <RegionMesh xs={xs} ys={ys} />
      )}

      {/* Density profile ribbon */}
      {paradigm === 'variable-density' && aSafe < bSafe && (
        <DensityMesh xs={xs} densities={densities} scale={DENSITY_SCALE} />
      )}

      {/* Top curve */}
      {aSafe < bSafe && curvePoints.length >= 2 && (
        <Line points={curvePoints} color="#f59e0b" lineWidth={2.5} />
      )}

      {/* x-axis baseline */}
      <Line
        points={[[aSafe - 0.4, 0, 0], [bSafe + 0.6, 0, 0]] as V3[]}
        color="#374151"
        lineWidth={1}
      />

      {/* Centroid crosshairs */}
      {mass > 1e-10 && isFinite(xBar) && (
        <>
          <Line
            points={[[aSafe, centroidCrosshairY, 0], [bSafe, centroidCrosshairY, 0]] as V3[]}
            color="#a5b4fc"
            lineWidth={1}
          />
          <Line
            points={[[xBar, 0, 0], [xBar, centroidCrosshairY + 0.4, 0]] as V3[]}
            color="#fbbf24"
            lineWidth={1.8}
          />
        </>
      )}

      {/* Centroid sphere */}
      {mass > 1e-10 && isFinite(xBar) && (
        <mesh position={[xBar, centroidSphereY, 0]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      )}

      {/* Fulcrum marker at x̄ on the x-axis */}
      {mass > 1e-10 && isFinite(xBar) && (
        <mesh position={[xBar, -0.1, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      )}

      {/* Label */}
      <Html position={[midX, maxY + 0.75, 0]}>
        <div
          style={{
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            background: 'rgba(0,0,0,0.6)',
            borderRadius: 6,
            padding: '4px 10px',
            minWidth: 190,
          }}
        >
          <div style={{ color: '#fbbf24', fontSize: 12, fontWeight: 700 }}>
            {paradigm === 'region' ? 'Region CoM' : 'Rod CoM (Variable ρ)'}
          </div>
          <div style={{ color: '#a5b4fc', fontSize: 11, marginTop: 2 }}>{bottomLabel}</div>
        </div>
      </Html>

      {/* Axis labels */}
      <Html position={[bSafe + 0.7, 0, 0]}>
        <div style={{ color: '#6b7280', fontSize: 11, pointerEvents: 'none', userSelect: 'none' }}>x</div>
      </Html>
      <Html position={[aSafe - 0.5, maxY + 0.3, 0]}>
        <div style={{ color: '#6b7280', fontSize: 10, pointerEvents: 'none', userSelect: 'none' }}>
          {paradigm === 'region' ? 'f(x)' : 'ρ(x)'}
        </div>
      </Html>
    </>
  )
}

// ── Public component ──────────────────────────────────────────────────────

export function CentersOfMassScene({ paradigm, fn, a, b, rho }: CentersOfMassSceneProps) {
  const aSafe = Math.min(a, b)
  const bSafe = Math.max(a, b)
  const camX = (aSafe + bSafe) / 2
  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [camX, 1.5, 7], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <CoMContent paradigm={paradigm} fn={fn} a={a} b={b} rho={rho} />
      <OrbitControls makeDefault />
    </Canvas>
  )
}
