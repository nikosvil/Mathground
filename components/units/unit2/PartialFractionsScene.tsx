'use client'

import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

type PFParadigm = 'distinct-roots' | 'repeated-root' | 'irreducible-quadratic'

export interface PartialFractionsSceneProps {
  paradigm: PFParadigm
  a: number
  b?: number
  c?: number
}

// ── Decomposition math ──────────────────────────────────────────────────────

interface Decomp {
  original: (x: number) => number
  comp1: (x: number) => number
  comp2: (x: number) => number
  poles: number[]
  origLabel: string
  comp1Label: string
  comp2Label: string
}

function decompose(paradigm: PFParadigm, a: number, b = 3, c = 1): Decomp {
  if (paradigm === 'distinct-roots') {
    // f(x) = 1/((x-a)(x-b)) = A/(x-a) + B/(x-b)
    // A = 1/(a-b), B = 1/(b-a)
    const denom = a - b
    const A = Math.abs(denom) < 1e-9 ? 1 : 1 / denom
    const B = -A
    return {
      original: (x) => 1 / ((x - a) * (x - b)),
      comp1: (x) => A / (x - a),
      comp2: (x) => B / (x - b),
      poles: [a, b],
      origLabel: `1/((x${a >= 0 ? '+' : ''}${(-a).toFixed(1)})(x${b >= 0 ? '+' : ''}${(-b).toFixed(1)}))`,
      comp1Label: `${A.toFixed(2)}/(x${a >= 0 ? '+' : ''}${(-a).toFixed(1)})`,
      comp2Label: `${B.toFixed(2)}/(x${b >= 0 ? '+' : ''}${(-b).toFixed(1)})`,
    }
  }

  if (paradigm === 'repeated-root') {
    // f(x) = x/((x-a)²) = 1/(x-a) + a/(x-a)²
    return {
      original: (x) => x / ((x - a) ** 2),
      comp1: (x) => 1 / (x - a),
      comp2: (x) => a / ((x - a) ** 2),
      poles: [a],
      origLabel: `x/(x${a >= 0 ? '+' : ''}${(-a).toFixed(1)})²`,
      comp1Label: `1/(x${a >= 0 ? '+' : ''}${(-a).toFixed(1)})`,
      comp2Label: `${a.toFixed(1)}/(x${a >= 0 ? '+' : ''}${(-a).toFixed(1)})²`,
    }
  }

  // irreducible-quadratic: 1/(x*(x²+bx+c))
  // = A/x + (Bx+C)/(x²+bx+c)
  // A = 1/c (from residue at x=0), Bx+C = -(Ax²+Abx)/(x²+bx+c) evaluated
  // A*1 = 1/c,  Bx+C = (1/c - 1/(x²+bx+c))*... partial calc
  // Simple: A = 1/c, B = -1/c, C = -b/c
  const A = 1 / c
  const B = -1 / c
  const C = -b / c
  return {
    original: (x) => 1 / (x * (x * x + b * x + c)),
    comp1: (x) => A / x,
    comp2: (x) => (B * x + C) / (x * x + b * x + c),
    poles: [0],
    origLabel: `1/(x·(x²${b !== 0 ? `+${b.toFixed(1)}x` : ''}+${c.toFixed(1)}))`,
    comp1Label: `${A.toFixed(2)}/x`,
    comp2Label: `(${B.toFixed(2)}x${C >= 0 ? '+' : ''}${C.toFixed(2)})/(x²+…)`,
  }
}

// ── Sample a function curve, skipping near poles ────────────────────────────

type V3 = [number, number, number]

function sampleCurve(
  fn: (x: number) => number,
  poles: number[],
  yOffset: number,
  xMin = -6,
  xMax = 6,
  n = 400,
  zCap = 4,
): V3[][] {
  const segments: V3[][] = []
  let current: V3[] = []
  const GAP = 0.12

  for (let i = 0; i <= n; i++) {
    const x = xMin + (i / n) * (xMax - xMin)
    const nearPole = poles.some((p) => Math.abs(x - p) < GAP)
    if (nearPole) {
      if (current.length >= 2) segments.push(current)
      current = []
      continue
    }
    const z = fn(x)
    if (!isFinite(z)) {
      if (current.length >= 2) segments.push(current)
      current = []
      continue
    }
    const zClamped = Math.max(-zCap, Math.min(zCap, z))
    current.push([x, yOffset, zClamped])
  }
  if (current.length >= 2) segments.push(current)
  return segments
}

// ── Pole glyph: glowing vertical column ─────────────────────────────────────

function PoleGlyph({ x, ySpan }: { x: number; ySpan: number }) {
  const pts: V3[] = [
    [x, -ySpan, -4],
    [x, -ySpan, 4],
    [x, 0, -4],
    [x, 0, 4],
    [x, ySpan, -4],
    [x, ySpan, 4],
  ]
  return (
    <>
      {/* vertical lines at each y-level */}
      {[-ySpan, 0, ySpan].map((y) => (
        <Line key={y} points={[[x, y, -4], [x, y, 4]] as V3[]} color="#ef4444" lineWidth={2} />
      ))}
      {/* glowing sphere at z=0 for each y-level */}
      {[-ySpan, 0, ySpan].map((y) => (
        <mesh key={y} position={[x, y, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
        </mesh>
      ))}
      {/* horizontal connectors between levels */}
      <Line points={[[x, -ySpan, 0], [x, ySpan, 0]] as V3[]} color="#ef444466" lineWidth={1} />
    </>
  )
}

// ── A single curve layer ─────────────────────────────────────────────────────

function CurveLayer({
  segments,
  color,
  lineWidth,
}: {
  segments: V3[][]
  color: string
  lineWidth: number
}) {
  return (
    <>
      {segments.map((seg, i) => (
        <Line key={i} points={seg} color={color} lineWidth={lineWidth} />
      ))}
    </>
  )
}

// ── Ghost plane at each y-level (reference panel) ───────────────────────────

function GhostPanel({ y, xRange, zRange }: { y: number; xRange: number; zRange: number }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(xRange * 2, zRange * 2)
    g.rotateX(Math.PI / 2)
    return g
  }, [xRange, zRange])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <mesh geometry={geo} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <meshBasicMaterial color="#1f2937" transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

// ── Main scene content ───────────────────────────────────────────────────────

function PFContent({ paradigm, a, b = 3, c = 1 }: PartialFractionsSceneProps) {
  const d = useMemo(() => decompose(paradigm, a, b, c), [paradigm, a, b, c])
  const Y_SPLIT = 1.8

  const origSegs = useMemo(
    () => sampleCurve(d.original, d.poles, 0),
    [d]
  )
  const comp1Segs = useMemo(
    () => sampleCurve(d.comp1, d.poles, -Y_SPLIT),
    [d]
  )
  const comp2Segs = useMemo(
    () => sampleCurve(d.comp2, d.poles, Y_SPLIT),
    [d]
  )

  // Connecting "explosion" lines at a few sample x values
  const connectorXs = useMemo(() => [-4, -2, 0, 2, 4].filter(
    (x) => d.poles.every((p) => Math.abs(x - p) > 0.5)
  ), [d.poles])

  return (
    <>
      {/* Ghost panels showing decomposition levels */}
      <GhostPanel y={0} xRange={6} zRange={4} />
      <GhostPanel y={-Y_SPLIT} xRange={6} zRange={4} />
      <GhostPanel y={Y_SPLIT} xRange={6} zRange={4} />

      {/* Original function — amber */}
      <CurveLayer segments={origSegs} color="#f59e0b" lineWidth={3} />

      {/* Component 1 — blue */}
      <CurveLayer segments={comp1Segs} color="#3b82f6" lineWidth={2.5} />

      {/* Component 2 — green */}
      <CurveLayer segments={comp2Segs} color="#22c55e" lineWidth={2.5} />

      {/* Pole glyphs */}
      {d.poles.map((px) => (
        <PoleGlyph key={px} x={px} ySpan={Y_SPLIT} />
      ))}

      {/* Thin connector lines (vertical in y) at sample x */}
      {connectorXs.map((x) => {
        const zO = Math.max(-4, Math.min(4, d.original(x)))
        const zC1 = Math.max(-4, Math.min(4, d.comp1(x)))
        const zC2 = Math.max(-4, Math.min(4, d.comp2(x)))
        return (
          <group key={x}>
            <Line
              points={[[x, -Y_SPLIT, zC1], [x, 0, zO]] as V3[]}
              color="#6b7280"
              lineWidth={0.8}
            />
            <Line
              points={[[x, 0, zO], [x, Y_SPLIT, zC2]] as V3[]}
              color="#6b7280"
              lineWidth={0.8}
            />
          </group>
        )
      })}

      {/* Labels */}
      <Html position={[6.5, 0, 0]}>
        <div style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', pointerEvents: 'none', textShadow: '0 1px 3px #000', userSelect: 'none' }}>
          {d.origLabel}
        </div>
      </Html>
      <Html position={[6.5, -Y_SPLIT, 0]}>
        <div style={{ color: '#60a5fa', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', pointerEvents: 'none', textShadow: '0 1px 3px #000', userSelect: 'none' }}>
          {d.comp1Label}
        </div>
      </Html>
      <Html position={[6.5, Y_SPLIT, 0]}>
        <div style={{ color: '#4ade80', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', pointerEvents: 'none', textShadow: '0 1px 3px #000', userSelect: 'none' }}>
          {d.comp2Label}
        </div>
      </Html>

      {/* Pole labels */}
      {d.poles.map((px) => (
        <Html key={px} position={[px, Y_SPLIT + 0.3, 4.2]}>
          <div style={{ color: '#f87171', fontSize: 11, fontWeight: 600, pointerEvents: 'none', userSelect: 'none' }}>
            x={px.toFixed(1)}
          </div>
        </Html>
      ))}

      {/* Axis x line */}
      <Line points={[[-6, 0, 0], [6, 0, 0]] as V3[]} color="#374151" lineWidth={1} />
      <Line points={[[-6, -Y_SPLIT, 0], [6, -Y_SPLIT, 0]] as V3[]} color="#374151" lineWidth={1} />
      <Line points={[[-6, Y_SPLIT, 0], [6, Y_SPLIT, 0]] as V3[]} color="#374151" lineWidth={1} />
    </>
  )
}

// ── Public component ─────────────────────────────────────────────────────────

export function PartialFractionsScene({ paradigm, a, b, c }: PartialFractionsSceneProps) {
  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [4, 6, 10], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <PFContent paradigm={paradigm} a={a} b={b} c={c} />
      <OrbitControls makeDefault />
    </Canvas>
  )
}
