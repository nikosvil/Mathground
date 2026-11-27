'use client'

import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

export interface TrigIntegralsSceneProps {
  paradigm: 'sin-cos' | 'tan-sec'
  m: number
  n: number
}

type V3 = [number, number, number]

// ── Numerical integration (midpoint rule) ─────────────────────────────────

function integrate(f: (t: number) => number, a: number, b: number, steps = 1000): number {
  if (b <= a) return 0
  const dt = (b - a) / steps
  let sum = 0
  for (let i = 0; i < steps; i++) {
    const v = f(a + (i + 0.5) * dt)
    sum += isFinite(v) ? v : 0
  }
  return sum * dt
}

// ── Strategy hints ────────────────────────────────────────────────────────

function sinCosStrategy(m: number, n: number): string {
  if (m % 2 === 1 && n % 2 === 1) return 'Both odd: u = cos x or u = sin x'
  if (m % 2 === 1) return 'Odd m: let u = cos x, extract sin x'
  if (n % 2 === 1) return 'Odd n: let u = sin x, extract cos x'
  return 'Both even: use half-angle identities'
}

function tanSecStrategy(m: number, n: number): string {
  if (n % 2 === 0) return 'Even n: let u = tan x, extract sec²x'
  if (m % 2 === 1) return 'Odd m: let u = sec x, extract sec x tan x'
  return 'Use reduction formula'
}

// ── Split crown by sign at z coordinate ─────────────────────────────────

function splitBySign(pts: V3[]): { pos: V3[][]; neg: V3[][] } {
  const pos: V3[][] = []
  const neg: V3[][] = []
  let cur: V3[] = []
  let sign: boolean | null = null

  for (const p of pts) {
    const s = p[2] >= 0
    if (sign === null || s !== sign) {
      if (cur.length >= 2) {
        if (sign) pos.push(cur)
        else neg.push(cur)
      }
      cur = [p]
      sign = s
    } else {
      cur.push(p)
    }
  }
  if (cur.length >= 2) {
    if (sign) pos.push(cur)
    else neg.push(cur)
  }

  return { pos, neg }
}

// ── Curtain geometry between base ring and crown ──────────────────────────

function buildCurtainGeometry(crown: V3[], base: V3[]): THREE.BufferGeometry {
  const N = crown.length - 1
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= N; i++) {
    positions.push(base[i][0], base[i][1], base[i][2])
    normals.push(0, 0, 1)
    positions.push(crown[i][0], crown[i][1], crown[i][2])
    normals.push(0, 0, 1)
  }

  for (let i = 0; i < N; i++) {
    const a = i * 2
    indices.push(a, a + 2, a + 1)
    indices.push(a + 1, a + 2, a + 3)
  }

  const geo = new THREE.BufferGeometry()
  geo.setIndex(indices)
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  return geo
}

// ── Curtain mesh component ────────────────────────────────────────────────

function Curtain({ crown, color }: { crown: V3[]; color: string }) {
  const base = useMemo((): V3[] => crown.map(p => [p[0], p[1], 0]), [crown])
  const geo = useMemo(() => buildCurtainGeometry(crown, base), [crown, base])
  useEffect(() => () => geo.dispose(), [geo])

  return (
    <mesh geometry={geo}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.2}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// ── Main scene ────────────────────────────────────────────────────────────

function TIContent({ paradigm, m, n }: TrigIntegralsSceneProps) {
  const mSafe = Math.max(1, Math.round(m))
  const nSafe = Math.max(1, Math.round(n))

  const { tMin, tMax, f, strategy, integralText } = useMemo(() => {
    if (paradigm === 'sin-cos') {
      const f = (t: number) =>
        Math.pow(Math.sin(t), mSafe) * Math.pow(Math.cos(t), nSafe)
      const val = integrate(f, 0, 2 * Math.PI)
      return {
        tMin: 0,
        tMax: 2 * Math.PI,
        f,
        strategy: sinCosStrategy(mSafe, nSafe),
        integralText: `∫₀²π sin^${mSafe}·cos^${nSafe} dθ ≈ ${val.toFixed(4)}`,
      }
    } else {
      const ε = 0.09
      const f = (t: number) => {
        const tan = Math.tan(t)
        const sec = 1 / Math.cos(t)
        if (!isFinite(tan) || !isFinite(sec)) return 0
        const v = Math.pow(tan, mSafe) * Math.pow(sec, nSafe)
        return isFinite(v) ? v : 0
      }
      const a = -Math.PI / 2 + ε
      const b = Math.PI / 2 - ε
      const val = integrate(f, a, b)
      return {
        tMin: a,
        tMax: b,
        f,
        strategy: tanSecStrategy(mSafe, nSafe),
        integralText: `∫ tan^${mSafe}·sec^${nSafe} dx ≈ ${val.toFixed(4)}`,
      }
    }
  }, [paradigm, mSafe, nSafe])

  const N = 300
  const zClamp = 3.0

  // Crown: (cos θ, sin θ, f(θ)) — integrand lifted above unit circle
  const crown = useMemo((): V3[] =>
    Array.from({ length: N + 1 }, (_, i) => {
      const t = tMin + (i / N) * (tMax - tMin)
      const fv = f(t)
      const z = isFinite(fv) ? Math.max(-zClamp, Math.min(zClamp, fv)) : 0
      return [Math.cos(t), Math.sin(t), z]
    }),
    [tMin, tMax, f]
  )

  // Base arc at z=0
  const base = useMemo((): V3[] =>
    Array.from({ length: N + 1 }, (_, i) => {
      const t = tMin + (i / N) * (tMax - tMin)
      return [Math.cos(t), Math.sin(t), 0]
    }),
    [tMin, tMax]
  )

  const { pos: posCrown, neg: negCrown } = useMemo(() => splitBySign(crown), [crown])

  // Stem lines at regular intervals
  const stems = useMemo(() => {
    const nStems = 24
    return Array.from({ length: nStems }, (_, i) => {
      const t = tMin + ((i + 0.5) / nStems) * (tMax - tMin)
      const fv = f(t)
      const z = isFinite(fv) ? Math.max(-zClamp, Math.min(zClamp, fv)) : 0
      return {
        pts: [[Math.cos(t), Math.sin(t), 0], [Math.cos(t), Math.sin(t), z]] as V3[],
        pos: z >= 0,
      }
    })
  }, [tMin, tMax, f])

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <directionalLight position={[-3, -2, -3]} intensity={0.4} />

      {/* Base arc (unit circle or domain arc) */}
      <Line points={base} color="#4b5563" lineWidth={1.5} />

      {/* Crown curve — positive (amber) */}
      {posCrown.map((seg, i) =>
        seg.length >= 2 ? (
          <Line key={`p${i}`} points={seg} color="#f59e0b" lineWidth={2.5} />
        ) : null
      )}

      {/* Crown curve — negative (indigo) */}
      {negCrown.map((seg, i) =>
        seg.length >= 2 ? (
          <Line key={`n${i}`} points={seg} color="#818cf8" lineWidth={2.5} />
        ) : null
      )}

      {/* Curtain mesh — positive */}
      {posCrown.map((seg, i) =>
        seg.length >= 2 ? (
          <Curtain key={`cp${i}`} crown={seg} color="#f59e0b" />
        ) : null
      )}

      {/* Curtain mesh — negative */}
      {negCrown.map((seg, i) =>
        seg.length >= 2 ? (
          <Curtain key={`cn${i}`} crown={seg} color="#818cf8" />
        ) : null
      )}

      {/* Stem lines */}
      {stems.map((stem, i) => (
        <Line
          key={i}
          points={stem.pts}
          color={stem.pos ? '#fbbf24' : '#a5b4fc'}
          lineWidth={0.7}
        />
      ))}

      {/* Integral value and strategy label */}
      <Html position={[0, 0, zClamp + 0.7]}>
        <div
          style={{
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            background: 'rgba(0,0,0,0.6)',
            borderRadius: 6,
            padding: '4px 10px',
            minWidth: 200,
          }}
        >
          <div style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 700 }}>
            {integralText}
          </div>
          <div style={{ color: '#9ca3af', fontSize: 10, marginTop: 2 }}>
            {strategy}
          </div>
        </div>
      </Html>
    </>
  )
}

// ── Public component ──────────────────────────────────────────────────────

export function TrigIntegralsScene({ paradigm, m, n }: TrigIntegralsSceneProps) {
  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [0, -3.5, 5.5], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <TIContent paradigm={paradigm} m={m} n={n} />
      <OrbitControls makeDefault />
    </Canvas>
  )
}
