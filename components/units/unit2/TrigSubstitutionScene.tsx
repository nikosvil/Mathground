'use client'

import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

type TrigSubParadigm = 'a2-x2' | 'a2+x2' | 'x2-a2'

export interface TrigSubstitutionSceneProps {
  paradigm: TrigSubParadigm
  a: number
  x: number
}

// ── 3D vector helpers ──────────────────────────────────────────────────────

type V3 = [number, number, number]

function v3add([ax, ay, az]: V3, [bx, by, bz]: V3): V3 { return [ax+bx, ay+by, az+bz] }
function v3scale([x, y, z]: V3, s: number): V3 { return [x*s, y*s, z*s] }
function v3sub(a: V3, b: V3): V3 { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]] }
function v3norm(v: V3): V3 {
  const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2])
  return len < 1e-9 ? [1, 0, 0] : [v[0]/len, v[1]/len, v[2]/len]
}

// ── Triangle geometry for each paradigm ───────────────────────────────────

interface TriData {
  O: V3; A: V3; P: V3; theta: number
  hypLabel: string; adjLabel: string; oppLabel: string
}

function computeTri(paradigm: TrigSubParadigm, a: number, x: number): TriData {
  if (paradigm === 'a2-x2') {
    const xc = Math.min(a, Math.max(0, x))
    const adj = Math.sqrt(Math.max(0, a*a - xc*xc))
    return {
      O: [0,0,0], A: [adj,0,0], P: [adj,xc,0],
      theta: Math.atan2(xc, adj),
      hypLabel: `a = ${a.toFixed(1)}`,
      adjLabel: `√(a²−x²) = ${adj.toFixed(2)}`,
      oppLabel: `x = ${xc.toFixed(2)}`,
    }
  }
  if (paradigm === 'a2+x2') {
    const opp = Math.max(0, x)
    const hyp = Math.sqrt(a*a + opp*opp)
    return {
      O: [0,0,0], A: [a,0,0], P: [a,opp,0],
      theta: Math.atan2(opp, a),
      hypLabel: `√(a²+x²) = ${hyp.toFixed(2)}`,
      adjLabel: `a = ${a.toFixed(1)}`,
      oppLabel: `x = ${opp.toFixed(2)}`,
    }
  }
  // x2-a2
  const xc = Math.max(a * 1.001, x)
  const opp = Math.sqrt(Math.max(0, xc*xc - a*a))
  return {
    O: [0,0,0], A: [a,0,0], P: [a,opp,0],
    theta: Math.atan2(opp, a),
    hypLabel: `x = ${xc.toFixed(2)}`,
    adjLabel: `a = ${a.toFixed(1)}`,
    oppLabel: `√(x²−a²) = ${opp.toFixed(2)}`,
  }
}

// ── Right angle marker at vertex A ─────────────────────────────────────────

function RightAngleMarker({ vertex, toO, toP, size }: { vertex: V3; toO: V3; toP: V3; size: number }) {
  const dOA = v3norm(v3sub(toO, vertex))
  const dAP = v3norm(v3sub(toP, vertex))
  const c1 = v3add(vertex, v3scale(dOA, size))
  const c2 = v3add(vertex, v3scale(dAP, size))
  const corner = v3add(v3add(vertex, v3scale(dOA, size)), v3scale(dAP, size))
  return <Line points={[c1, corner, c2]} color="#6b7280" lineWidth={1.5} />
}

// ── Angle arc near vertex O ─────────────────────────────────────────────────

function AngleArc({ radius, theta }: { radius: number; theta: number }) {
  const pts = useMemo((): V3[] =>
    Array.from({ length: 25 }, (_, i) => {
      const ang = (i / 24) * theta
      return [radius * Math.cos(ang), radius * Math.sin(ang), 0]
    }), [radius, theta])
  if (theta < 0.02) return null
  return <Line points={pts} color="#f59e0b" lineWidth={2} />
}

// ── Reference circle in the xy-plane ────────────────────────────────────────

function RefCircle({ radius }: { radius: number }) {
  const pts = useMemo((): V3[] =>
    Array.from({ length: 65 }, (_, i) => {
      const ang = (i / 64) * Math.PI * 2
      return [radius * Math.cos(ang), radius * Math.sin(ang), 0]
    }), [radius])
  return <Line points={pts} color="#374151" lineWidth={1} />
}

// ── Sector sweep shading for a2-x2 (shows the integral area) ─────────────

function SectorSweep({ radius, theta }: { radius: number; theta: number }) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    const N = 48
    for (let i = 0; i <= N; i++) {
      const ang = (i / N) * theta
      shape.lineTo(radius * Math.cos(ang), radius * Math.sin(ang))
    }
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  }, [radius, theta])
  useEffect(() => () => geo.dispose(), [geo])
  if (theta < 0.02) return null
  return (
    <mesh geometry={geo} renderOrder={1}>
      <meshBasicMaterial color="#f59e0b" transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

// ── Main scene content ─────────────────────────────────────────────────────

function TrigContent({ paradigm, a, x }: TrigSubstitutionSceneProps) {
  const tri = computeTri(paradigm, a, x)
  const { O, A, P } = tri

  const faceGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(A[0], A[1])
    shape.lineTo(P[0], P[1])
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  }, [A[0], A[1], P[0], P[1]])

  useEffect(() => () => faceGeo.dispose(), [faceGeo])

  const arcR = Math.min(a * 0.18, 0.5)
  const thetaMid = tri.theta / 2
  const markerSize = Math.min(a * 0.09, 0.14)

  // Label positions: offset from midpoints of each side
  const hypMid: V3 = [P[0] * 0.42, P[1] * 0.58, 0]
  const adjMid: V3 = [A[0] * 0.5, -0.22, 0]
  const oppMid: V3 = [A[0] + 0.1, P[1] * 0.5, 0]

  return (
    <>
      {/* Triangle face */}
      <mesh geometry={faceGeo} renderOrder={0}>
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Triangle edges */}
      <Line points={[O, P]} color="#3b82f6" lineWidth={4} />
      <Line points={[O, A]} color="#22c55e" lineWidth={3} />
      <Line points={[A, P]} color="#ef4444" lineWidth={3} />

      {/* Right angle marker at A */}
      <RightAngleMarker vertex={A} toO={O} toP={P} size={markerSize} />

      {/* Angle arc at O */}
      <AngleArc radius={arcR} theta={tri.theta} />

      {/* θ label */}
      {tri.theta > 0.1 && (
        <Html position={[arcR * 1.7 * Math.cos(thetaMid), arcR * 1.7 * Math.sin(thetaMid), 0]}>
          <div style={{ color: '#fbbf24', fontSize: 14, fontWeight: 700, pointerEvents: 'none', userSelect: 'none' }}>
            θ
          </div>
        </Html>
      )}

      {/* 3D sphere for a2-x2: the geometric proof that P lives on a sphere of radius a */}
      {paradigm === 'a2-x2' && (
        <>
          {/* Translucent solid sphere */}
          <mesh>
            <sphereGeometry args={[a, 32, 24]} />
            <meshStandardMaterial color="#6b7280" transparent opacity={0.06} side={THREE.DoubleSide} />
          </mesh>
          {/* Wireframe overlay for 3D depth cue */}
          <mesh>
            <sphereGeometry args={[a, 16, 12]} />
            <meshBasicMaterial color="#374151" wireframe transparent opacity={0.22} />
          </mesh>
          {/* Sector sweep showing the angle θ */}
          <SectorSweep radius={a * 0.98} theta={tri.theta} />
        </>
      )}

      {/* Reference circle for all paradigms */}
      <RefCircle radius={a} />

      {/* Glowing dot at P — lives on the sphere surface for a2-x2 */}
      <mesh position={P}>
        <sphereGeometry args={[Math.min(a * 0.045, 0.09), 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} />
      </mesh>

      {/* Side labels */}
      <Html position={hypMid}>
        <div style={{ color: '#60a5fa', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', textShadow: '0 1px 3px #000', userSelect: 'none' }}>
          {tri.hypLabel}
        </div>
      </Html>
      <Html position={adjMid}>
        <div style={{ color: '#4ade80', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', textShadow: '0 1px 3px #000', userSelect: 'none' }}>
          {tri.adjLabel}
        </div>
      </Html>
      <Html position={oppMid}>
        <div style={{ color: '#f87171', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', textShadow: '0 1px 3px #000', userSelect: 'none' }}>
          {tri.oppLabel}
        </div>
      </Html>
    </>
  )
}

// ── Public component ───────────────────────────────────────────────────────

export function TrigSubstitutionScene({ paradigm, a, x }: TrigSubstitutionSceneProps) {
  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [3, 2.5, 5], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} />
      <TrigContent paradigm={paradigm} a={a} x={x} />
      <OrbitControls makeDefault />
    </Canvas>
  )
}
