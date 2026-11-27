'use client'

import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import { parseExpression } from '@/lib/math/parser'

export interface ArcLengthSceneProps {
  fn: string
  a: number
  b: number
  n: number
}

type V3 = [number, number, number]

// ── Numerical derivative ──────────────────────────────────────────────────

function deriv(f: (x: number) => number, x: number, h = 1e-5): number {
  return (f(x + h) - f(x - h)) / (2 * h)
}

// ── Arc length via midpoint rule ──────────────────────────────────────────

function computeArcLength(f: (x: number) => number, a: number, b: number, m = 800): number {
  if (b <= a) return 0
  const dx = (b - a) / m
  let sum = 0
  for (let i = 0; i < m; i++) {
    const x = a + (i + 0.5) * dx
    const fp = deriv(f, x)
    sum += Math.sqrt(1 + fp * fp)
  }
  return sum * dx
}

// ── Polygonal approximation length ───────────────────────────────────────

function polygonalLength(f: (x: number) => number, a: number, b: number, n: number): number {
  if (b <= a || n < 1) return 0
  const dx = (b - a) / n
  let sum = 0
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx
    const x1 = x0 + dx
    const dy = f(x1) - f(x0)
    sum += Math.sqrt(dx * dx + dy * dy)
  }
  return sum
}

// ── Sample smooth curve ───────────────────────────────────────────────────

function sampleCurve(f: (x: number) => number, a: number, b: number, m = 300, yClamp = 5): V3[] {
  if (b <= a) return []
  return Array.from({ length: m + 1 }, (_, i) => {
    const x = a + (i / m) * (b - a)
    const y = isFinite(f(x)) ? Math.max(-yClamp, Math.min(yClamp, f(x))) : 0
    return [x, y, 0] as V3
  })
}

// ── Chord segments ────────────────────────────────────────────────────────

function ChordSegments({ f, a, b, n }: { f: (x: number) => number; a: number; b: number; n: number }) {
  const segments = useMemo(() => {
    if (b <= a || n < 1) return []
    const dx = (b - a) / n
    return Array.from({ length: n }, (_, i) => {
      const x0 = a + i * dx
      const x1 = x0 + dx
      const y0 = isFinite(f(x0)) ? Math.max(-5, Math.min(5, f(x0))) : 0
      const y1 = isFinite(f(x1)) ? Math.max(-5, Math.min(5, f(x1))) : 0
      return { pts: [[x0, y0, 0], [x1, y1, 0]] as V3[], x0, x1, y0, y1 }
    })
  }, [f, a, b, n])

  return (
    <>
      {segments.map((seg, i) => (
        <group key={i}>
          {/* Chord line */}
          <Line points={seg.pts} color="#f59e0b" lineWidth={2} />
          {/* Right triangle beneath chord: Δx along base, Δy vertical */}
          <Line
            points={[
              [seg.x0, seg.y0, -0.5],
              [seg.x1, seg.y0, -0.5],
              [seg.x1, seg.y1, -0.5],
              [seg.x0, seg.y0, -0.5],
            ] as V3[]}
            color="#f59e0b66"
            lineWidth={0.8}
          />
        </group>
      ))}
    </>
  )
}

// ── Node dots at chord endpoints ──────────────────────────────────────────

function NodeDots({ f, a, b, n }: { f: (x: number) => number; a: number; b: number; n: number }) {
  const pts = useMemo(() => {
    if (b <= a) return []
    const dx = (b - a) / n
    return Array.from({ length: n + 1 }, (_, i) => {
      const x = a + i * dx
      const y = isFinite(f(x)) ? Math.max(-5, Math.min(5, f(x))) : 0
      return { x, y }
    })
  }, [f, a, b, n])

  return (
    <>
      {pts.map(({ x, y }, i) => (
        <mesh key={i} position={[x, y, 0]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.2} />
        </mesh>
      ))}
    </>
  )
}

// ── Main scene content ────────────────────────────────────────────────────

function ALContent({ fn, a, b, n }: ArcLengthSceneProps) {
  const parsed = useMemo(() => parseExpression(fn, ['x']), [fn])
  const f = useMemo(
    () => (x: number) => (parsed.valid && parsed.fn ? parsed.fn({ x }) as number : 0),
    [parsed]
  )

  const aMin = Math.min(a, b)
  const bMax = Math.max(a, b)
  const nSafe = Math.max(1, Math.round(n))

  const smoothPts = useMemo(() => sampleCurve(f, aMin, bMax), [f, aMin, bMax])

  const Ln = useMemo(() => polygonalLength(f, aMin, bMax, nSafe), [f, aMin, bMax, nSafe])
  const L  = useMemo(() => computeArcLength(f, aMin, bMax), [f, aMin, bMax])

  const midX = (aMin + bMax) / 2
  const topY = smoothPts.length > 0
    ? Math.max(...smoothPts.map(p => p[1])) + 0.6
    : 2

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 6, 5]} intensity={1.2} />

      {/* Smooth curve — indigo */}
      {smoothPts.length >= 2 && (
        <Line points={smoothPts} color="#6366f1" lineWidth={3} />
      )}

      {/* Chord segments + right triangles */}
      {aMin < bMax && (
        <ChordSegments f={f} a={aMin} b={bMax} n={nSafe} />
      )}

      {/* Node dots */}
      {aMin < bMax && (
        <NodeDots f={f} a={aMin} b={bMax} n={nSafe} />
      )}

      {/* x-axis baseline */}
      <Line
        points={[[aMin - 0.3, 0, 0], [bMax + 0.3, 0, 0]] as V3[]}
        color="#374151"
        lineWidth={1}
      />

      {/* Length comparison label */}
      <Html position={[midX, topY, 0]}>
        <div style={{ textAlign: 'center', pointerEvents: 'none', userSelect: 'none', background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '4px 8px' }}>
          <div style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>
            L_n={nSafe} ≈ {Ln.toFixed(4)}
          </div>
          <div style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 700 }}>
            L (integral) ≈ {L.toFixed(4)}
          </div>
          <div style={{ color: aMin < bMax ? '#4ade80' : '#6b7280', fontSize: 10, marginTop: 1 }}>
            {aMin < bMax ? `error ≈ ${Math.abs(Ln - L).toFixed(5)}` : 'a = b'}
          </div>
        </div>
      </Html>

      {/* a / b axis markers */}
      <Html position={[aMin, -0.3, 0]}>
        <div style={{ color: '#9ca3af', fontSize: 10, pointerEvents: 'none', userSelect: 'none' }}>a</div>
      </Html>
      <Html position={[bMax, -0.3, 0]}>
        <div style={{ color: '#9ca3af', fontSize: 10, pointerEvents: 'none', userSelect: 'none' }}>b</div>
      </Html>
    </>
  )
}

// ── Public component ──────────────────────────────────────────────────────

export function ArcLengthScene({ fn, a, b, n }: ArcLengthSceneProps) {
  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [3, 2, 8], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ALContent fn={fn} a={a} b={b} n={n} />
      <OrbitControls makeDefault />
    </Canvas>
  )
}
