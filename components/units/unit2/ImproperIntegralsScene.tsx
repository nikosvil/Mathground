'use client'

import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

type IIParadigm = 'infinite-bound' | 'vertical-asymptote'

export interface ImproperIntegralsSceneProps {
  paradigm: IIParadigm
  p: number
  B?: number    // upper limit for infinite-bound  (default 20)
  eps?: number  // lower limit for vertical-asymptote (default 0.1)
}

// ── Convergence logic ─────────────────────────────────────────────────────

function convergenceInfo(paradigm: IIParadigm, p: number): { converges: boolean; value: string } {
  if (paradigm === 'infinite-bound') {
    if (p > 1) {
      const val = 1 / (p - 1)
      return { converges: true, value: `1/(p−1) = ${val.toFixed(3)}` }
    }
    return { converges: false, value: '∞ (diverges)' }
  }
  // vertical-asymptote: ∫_0^1 1/x^p dx = 1/(1-p) when p < 1
  if (p < 1) {
    const val = 1 / (1 - p)
    return { converges: true, value: `1/(1−p) = ${val.toFixed(3)}` }
  }
  return { converges: false, value: '∞ (diverges)' }
}

// ── Build surface of revolution around x-axis ─────────────────────────────
// Profile: radius r(x) = min(fn(x), rMax) for x in [xMin, xMax]

function buildHornGeometry(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  nX: number,
  nTheta: number,
  rMax: number,
): THREE.BufferGeometry {
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= nX; i++) {
    const x = xMin + (i / nX) * (xMax - xMin)
    const r = Math.max(0, Math.min(fn(x), rMax))
    for (let j = 0; j <= nTheta; j++) {
      const theta = (j / nTheta) * Math.PI * 2
      const y = r * Math.cos(theta)
      const z = r * Math.sin(theta)
      positions.push(x, y, z)
      // Outward normal (approximate: radial direction)
      normals.push(0, Math.cos(theta), Math.sin(theta))
    }
  }

  for (let i = 0; i < nX; i++) {
    for (let j = 0; j < nTheta; j++) {
      const a = i * (nTheta + 1) + j
      const b = a + 1
      const c = a + (nTheta + 1)
      const d = c + 1
      indices.push(a, c, b)
      indices.push(b, c, d)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setIndex(indices)
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  return geo
}

// ── End cap disk at a given x ─────────────────────────────────────────────

function EndCap({ x, radius, color }: { x: number; radius: number; color: string }) {
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(Math.min(radius, 2), 32)
    g.rotateY(Math.PI / 2)
    return g
  }, [radius])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <mesh geometry={geo} position={[x, 0, 0]}>
      <meshStandardMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ── Gradient horn mesh ────────────────────────────────────────────────────

function HornMesh({
  fn,
  xMin,
  xMax,
  converges,
}: {
  fn: (x: number) => number
  xMin: number
  xMax: number
  converges: boolean
}) {
  const nX = 180
  const nTheta = 48
  const rMax = 2.2

  const geo = useMemo(
    () => buildHornGeometry(fn, xMin, xMax, nX, nTheta, rMax),
    [fn, xMin, xMax]
  )
  useEffect(() => () => geo.dispose(), [geo])

  const outerColor = converges ? '#3b82f6' : '#ef4444'

  return (
    <>
      {/* Solid outer surface */}
      <mesh geometry={geo}>
        <meshStandardMaterial
          color={outerColor}
          transparent
          opacity={0.55}
          side={THREE.FrontSide}
          metalness={0.1}
          roughness={0.4}
        />
      </mesh>
      {/* Inner surface for depth */}
      <mesh geometry={geo}>
        <meshStandardMaterial
          color={outerColor}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  )
}

// ── Filled area silhouette (top profile curve + shaded region) ────────────

function ProfileSilhouette({
  fn,
  xMin,
  xMax,
  color,
}: {
  fn: (x: number) => number
  xMin: number
  xMax: number
  color: string
}) {
  const N = 200
  const rMax = 2.2

  const topPts = useMemo(() => {
    const pts: [number, number, number][] = []
    for (let i = 0; i <= N; i++) {
      const x = xMin + (i / N) * (xMax - xMin)
      const r = Math.min(fn(x), rMax)
      pts.push([x, r, 0])
    }
    return pts
  }, [fn, xMin, xMax])

  const bottomPts = useMemo((): [number, number, number][] => [
    [xMin, 0, 0],
    [xMax, 0, 0],
  ], [xMin, xMax])

  const shadedGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(xMin, 0)
    for (let i = 0; i <= N; i++) {
      const x = xMin + (i / N) * (xMax - xMin)
      const r = Math.min(fn(x), rMax)
      shape.lineTo(x, r)
    }
    shape.lineTo(xMax, 0)
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  }, [fn, xMin, xMax])

  useEffect(() => () => shadedGeo.dispose(), [shadedGeo])

  return (
    <>
      {/* Profile curve */}
      <Line points={topPts} color={color} lineWidth={2.5} />
      {/* x-axis base */}
      <Line points={bottomPts} color="#374151" lineWidth={1} />
      {/* Shaded area */}
      <mesh geometry={shadedGeo} position={[0, 0, 0.01]}>
        <meshBasicMaterial color={color} transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </>
  )
}

// ── Main scene content ─────────────────────────────────────────────────────

function IIContent({ paradigm, p, B = 20, eps = 0.1 }: ImproperIntegralsSceneProps) {
  const pClamped = Math.max(0.05, p)
  const info = convergenceInfo(paradigm, pClamped)

  // Profile fn: radius at each x = 1/x^(p/2) so that volume = π∫1/x^p dx
  const profileFn = useMemo(
    () => (x: number) => 1 / Math.pow(Math.max(x, 1e-6), pClamped / 2),
    [pClamped]
  )

  const [xMin, xMax] = paradigm === 'infinite-bound'
    ? [1, Math.max(2, B ?? 20)]
    : [Math.max(1e-4, eps ?? 0.1), 1]

  const curveColor = info.converges ? '#3b82f6' : '#ef4444'
  const startCapR = profileFn(xMin)
  const endCapR = profileFn(xMax)

  // Label line showing convergence/divergence arrow
  const arrowTip: [number, number, number] = paradigm === 'infinite-bound'
    ? [xMax + 0.3, 0, 0]
    : [0, 0, 0]

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} />
      <directionalLight position={[-5, -4, -3]} intensity={0.4} />

      {/* 3D Gabriel's Horn surface */}
      <HornMesh fn={profileFn} xMin={xMin} xMax={xMax} converges={info.converges} />

      {/* End caps */}
      <EndCap x={xMin} radius={startCapR} color={curveColor} />
      <EndCap x={xMax} radius={endCapR} color={curveColor} />

      {/* Profile silhouette in the y-z=0 plane */}
      <ProfileSilhouette fn={profileFn} xMin={xMin} xMax={xMax} color={curveColor} />

      {/* x-axis */}
      <Line
        points={[[-0.5, 0, 0], [xMax + 0.6, 0, 0]] as [number,number,number][]}
        color="#6b7280"
        lineWidth={1}
      />

      {/* Dashed arrow for ∞ limit */}
      {paradigm === 'infinite-bound' && (
        <>
          <Line
            points={[[xMax, 0, 0], [xMax + 0.5, 0, 0]] as [number,number,number][]}
            color="#f59e0b"
            lineWidth={2}
          />
          <Html position={[xMax + 0.6, 0.15, 0]}>
            <div style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700, pointerEvents: 'none', userSelect: 'none' }}>
              B={Math.round(B ?? 20)}→∞
            </div>
          </Html>
        </>
      )}

      {/* ε label */}
      {paradigm === 'vertical-asymptote' && (
        <Html position={[xMin - 0.05, 0.25, 0]}>
          <div style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700, pointerEvents: 'none', userSelect: 'none' }}>
            ε={(eps ?? 0.1).toFixed(3)}→0⁺
          </div>
        </Html>
      )}

      {/* Integral value label */}
      <Html position={[(xMin + xMax) / 2, 2.6, 0]}>
        <div style={{ textAlign: 'center', pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{ color: '#9ca3af', fontSize: 10, marginBottom: 2 }}>
            ∫ 1/xᵖ dx  (p={pClamped.toFixed(1)})
          </div>
          <div style={{ color: info.converges ? '#4ade80' : '#f87171', fontSize: 12, fontWeight: 700 }}>
            {info.converges ? '✓ Converges' : '✗ Diverges'}
          </div>
          <div style={{ color: '#d1d5db', fontSize: 11 }}>
            = {info.value}
          </div>
        </div>
      </Html>

      {/* Origin marker */}
      {paradigm === 'vertical-asymptote' && (
        <Html position={[0, -0.25, 0]}>
          <div style={{ color: '#6b7280', fontSize: 10, pointerEvents: 'none', userSelect: 'none' }}>0</div>
        </Html>
      )}
      <Html position={[xMin, -0.25, 0]}>
        <div style={{ color: '#9ca3af', fontSize: 10, pointerEvents: 'none', userSelect: 'none' }}>
          {paradigm === 'infinite-bound' ? '1' : `ε`}
        </div>
      </Html>
      <Html position={[xMax, -0.25, 0]}>
        <div style={{ color: '#9ca3af', fontSize: 10, pointerEvents: 'none', userSelect: 'none' }}>
          {paradigm === 'infinite-bound' ? `B` : '1'}
        </div>
      </Html>
    </>
  )
}

// ── Public component ───────────────────────────────────────────────────────

export function ImproperIntegralsScene({ paradigm, p, B, eps }: ImproperIntegralsSceneProps) {
  const camX = paradigm === 'infinite-bound' ? 10 : 1
  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [camX, 3, 7], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <IIContent paradigm={paradigm} p={p} B={B} eps={eps} />
      <OrbitControls makeDefault />
    </Canvas>
  )
}
