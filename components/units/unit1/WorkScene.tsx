'use client'

import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import { parseExpression } from '@/lib/math/parser'

export interface WorkSceneProps {
  paradigm: 'spring' | 'variable' | 'lifting'
  fn: string
  k: number
  a: number
  b: number
  L: number
  w: number
}

type V3 = [number, number, number]

// ── Numerical integration ─────────────────────────────────────────────────

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

// ── 3D spring helix ───────────────────────────────────────────────────────

function SpringHelix({ a, b }: { a: number; b: number }) {
  const pts = useMemo((): V3[] => {
    const M = 300
    const N = 8     // coils
    const r = 0.28  // coil radius
    const range = Math.max(b - a, 0.001)
    return Array.from({ length: M + 1 }, (_, i) => {
      const t = i / M
      const x = a + t * range
      const angle = t * N * 2 * Math.PI
      return [x, r * Math.cos(angle), r * Math.sin(angle)]
    })
  }, [a, b])

  return <Line points={pts} color="#6366f1" lineWidth={2.5} />
}

// ── Hanging chain (fine helix along y-axis) ───────────────────────────────

function LiftingChain({ L }: { L: number }) {
  const pts = useMemo((): V3[] => {
    const M = 400
    const N = 20   // tight coils mimicking chain links
    const r = 0.07
    return Array.from({ length: M + 1 }, (_, i) => {
      const t = i / M
      const y = t * L
      const angle = t * N * 2 * Math.PI
      return [r * Math.cos(angle), y, r * Math.sin(angle)]
    })
  }, [L])

  return <Line points={pts} color="#f59e0b" lineWidth={2} />
}

// ── Force bars along the axis ─────────────────────────────────────────────

function ForceBars({
  f, a, b, fMax, color,
}: { f: (x: number) => number; a: number; b: number; fMax: number; color: string }) {
  const scale = fMax > 0 ? 1.6 / fMax : 1
  const bars = useMemo(() => {
    const n = 16
    return Array.from({ length: n }, (_, i) => {
      const x = a + ((i + 0.5) / n) * (b - a)
      const fv = f(x)
      const h = isFinite(fv) ? fv * scale : 0
      return { x, h }
    })
  }, [f, a, b, fMax])

  return (
    <>
      {bars.map(({ x, h }, i) => (
        <Line key={i} points={[[x, 0, 0], [x, h, 0]] as V3[]} color={color} lineWidth={1.5} />
      ))}
    </>
  )
}

// ── Smooth force curve ────────────────────────────────────────────────────

function ForceCurve({
  f, a, b, fMax, color,
}: { f: (x: number) => number; a: number; b: number; fMax: number; color: string }) {
  const scale = fMax > 0 ? 1.6 / fMax : 1
  const pts = useMemo((): V3[] => {
    return Array.from({ length: 201 }, (_, i) => {
      const x = a + (i / 200) * (b - a)
      const fv = f(x)
      const h = isFinite(fv) ? Math.max(-3, Math.min(3, fv * scale)) : 0
      return [x, h, 0]
    })
  }, [f, a, b, fMax])

  return <Line points={pts} color={color} lineWidth={2.2} />
}

// ── Weight element bars (lifting: horizontal bars show w·(L−y) ) ──────────

function WeightBars({ L, w }: { L: number; w: number }) {
  const scale = L > 0 ? 2.0 / (w * L) : 1
  const n = 20
  const bars = useMemo(() => {
    return Array.from({ length: n }, (_, i) => {
      const y = ((i + 0.5) / n) * L
      const len = w * (L - y) * scale
      return { y, len }
    })
  }, [L, w, n])

  return (
    <>
      {bars.map(({ y, len }, i) => (
        <Line key={i} points={[[0, y, 0], [len, y, 0]] as V3[]} color="#f59e0b" lineWidth={1.5} />
      ))}
      {/* Wedge outline */}
      <Line
        points={[[0, 0, 0], [w * L * scale, 0, 0], [0, L, 0], [0, 0, 0]] as V3[]}
        color="#fbbf24"
        lineWidth={1}
      />
    </>
  )
}

// ── Main scene content ────────────────────────────────────────────────────

function WorkContent({ paradigm, fn, k, a, b, L, w }: WorkSceneProps) {
  const aSafe = paradigm !== 'lifting' ? Math.min(a, b) : 0
  const bSafe = paradigm !== 'lifting' ? Math.max(a, b) : 1
  const kSafe = Math.max(0.1, k)
  const LSafe = Math.max(0.5, L)
  const wSafe = Math.max(0.1, w)

  const { f, fMax, work, label, sublabel } = useMemo(() => {
    if (paradigm === 'spring') {
      const f = (x: number) => kSafe * x
      const fMax = kSafe * bSafe
      const work = (kSafe / 2) * (bSafe ** 2 - aSafe ** 2)
      return {
        f, fMax, work,
        label: `W = ½k(b²−a²) = ${work.toFixed(3)} J`,
        sublabel: "F = kx  (Hooke's Law)",
      }
    } else if (paradigm === 'variable') {
      const parsed = parseExpression(fn, ['x'])
      const f = (x: number) =>
        parsed.valid && parsed.fn ? (parsed.fn({ x }) as number) : 0
      const samples = Array.from({ length: 50 }, (_, i) => {
        const x = aSafe + (i / 49) * Math.max(bSafe - aSafe, 0.001)
        const v = f(x)
        return isFinite(v) ? Math.abs(v) : 0
      })
      const fMax = Math.max(0.1, ...samples)
      const work = integrate(f, aSafe, bSafe)
      return {
        f, fMax, work,
        label: `W = ∫F(x) dx ≈ ${work.toFixed(3)} J`,
        sublabel: 'Variable force',
      }
    } else {
      // lifting: W = ∫₀ᴸ w(L−x) dx = ½wL²
      const work = 0.5 * wSafe * LSafe ** 2
      const f = (x: number) => wSafe * (LSafe - x)
      const fMax = wSafe * LSafe
      return {
        f, fMax, work,
        label: `W = ½wL² = ${work.toFixed(3)} J`,
        sublabel: `Chain: L=${LSafe} m, w=${wSafe} N/m`,
      }
    }
  }, [paradigm, fn, kSafe, aSafe, bSafe, LSafe, wSafe])

  const labelPos: V3 =
    paradigm === 'lifting'
      ? [1.5, LSafe + 0.6, 0]
      : [(aSafe + bSafe) / 2, 2.4, 0]

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 5]} intensity={1.2} />
      <directionalLight position={[-3, -2, -3]} intensity={0.4} />

      {/* ── Spring paradigm ── */}
      {paradigm === 'spring' && (
        <>
          {aSafe < bSafe && <SpringHelix a={aSafe} b={bSafe} />}
          {aSafe < bSafe && <ForceCurve f={f} a={aSafe} b={bSafe} fMax={fMax} color="#f59e0b" />}
          {aSafe < bSafe && <ForceBars f={f} a={aSafe} b={bSafe} fMax={fMax} color="#fbbf24" />}
          <Line points={[[aSafe - 0.3, 0, 0], [bSafe + 0.5, 0, 0]] as V3[]} color="#374151" lineWidth={1} />
          <Line points={[[aSafe, -0.1, 0], [aSafe, 1.9, 0]] as V3[]} color="#374151" lineWidth={1} />
        </>
      )}

      {/* ── Variable force paradigm ── */}
      {paradigm === 'variable' && (
        <>
          {aSafe < bSafe && <ForceCurve f={f} a={aSafe} b={bSafe} fMax={fMax} color="#6366f1" />}
          {aSafe < bSafe && <ForceBars f={f} a={aSafe} b={bSafe} fMax={fMax} color="#818cf8" />}
          <Line points={[[aSafe - 0.3, 0, 0], [bSafe + 0.5, 0, 0]] as V3[]} color="#374151" lineWidth={1} />
          <Line points={[[aSafe, -0.1, 0], [aSafe, 1.9, 0]] as V3[]} color="#374151" lineWidth={1} />
        </>
      )}

      {/* ── Lifting paradigm ── */}
      {paradigm === 'lifting' && (
        <>
          <LiftingChain L={LSafe} />
          <WeightBars L={LSafe} w={wSafe} />
          <Line points={[[0, -0.3, 0], [0, LSafe + 0.5, 0]] as V3[]} color="#374151" lineWidth={1} />
        </>
      )}

      {/* Work label */}
      <Html position={labelPos}>
        <div style={{
          textAlign: 'center',
          pointerEvents: 'none',
          userSelect: 'none',
          background: 'rgba(0,0,0,0.6)',
          borderRadius: 6,
          padding: '4px 10px',
          minWidth: 180,
        }}>
          <div style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 700 }}>{label}</div>
          <div style={{ color: '#9ca3af', fontSize: 10, marginTop: 2 }}>{sublabel}</div>
        </div>
      </Html>

      {/* Axis labels */}
      {paradigm !== 'lifting' && aSafe < bSafe && (
        <>
          <Html position={[bSafe + 0.6, 0, 0]}>
            <div style={{ color: '#6b7280', fontSize: 11, pointerEvents: 'none', userSelect: 'none' }}>x</div>
          </Html>
          <Html position={[aSafe, 2.0, 0]}>
            <div style={{ color: '#6b7280', fontSize: 11, pointerEvents: 'none', userSelect: 'none' }}>F</div>
          </Html>
        </>
      )}
      {paradigm === 'lifting' && (
        <Html position={[0, LSafe + 0.6, 0]}>
          <div style={{ color: '#6b7280', fontSize: 11, pointerEvents: 'none', userSelect: 'none' }}>y</div>
        </Html>
      )}
    </>
  )
}

// ── Public component ──────────────────────────────────────────────────────

export function WorkScene({ paradigm, fn, k, a, b, L, w }: WorkSceneProps) {
  const camX = paradigm === 'lifting' ? 3 : Math.max(a, b) / 2
  const camY = paradigm === 'lifting' ? Math.max(0.5, L) / 2 : 1.2
  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [camX, camY, 7], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <WorkContent paradigm={paradigm} fn={fn} k={k} a={a} b={b} L={L} w={w} />
      <OrbitControls makeDefault />
    </Canvas>
  )
}
