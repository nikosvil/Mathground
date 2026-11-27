'use client'

import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

export interface FluidPressureSceneProps {
  paradigm: 'flat-plate' | 'submerged'
  depth: number  // flat-plate: total plate height; submerged: depth of plate top below surface
  width: number  // plate width (flat-plate)
  h: number      // plate height (submerged), ignored for flat-plate (depth = plate height)
}

type V3 = [number, number, number]

// ── Plate mesh with pressure-gradient vertex colors ───────────────────────
// Coordinate convention:
//   y = 0 → water surface (top)
//   y < 0 → submerged (deeper = more negative)
//   x ∈ [-halfW, halfW] → plate width

function buildPlateGeometry(
  yTop: number,
  yBot: number,
  halfW: number,
): THREE.BufferGeometry {
  const N = 24
  const geo = new THREE.BufferGeometry()
  if (Math.abs(yBot - yTop) < 1e-6) return geo

  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []

  const dMax = Math.max(Math.abs(yBot), 0.001)

  for (let i = 0; i <= N; i++) {
    const t = i / N
    const y = yTop + t * (yBot - yTop)
    const depth = -y  // pressure ~ depth
    const pt = depth / dMax  // 0 at surface, 1 at max depth

    // light-blue (#93c5fd) → deep-indigo (#3730a3)
    const r = 0.576 - pt * 0.37
    const g = 0.773 - pt * 0.68
    const bv = 0.992 - pt * 0.35

    positions.push(-halfW, y, 0)
    colors.push(r, g, bv)
    positions.push(halfW, y, 0)
    colors.push(r, g, bv)
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

// ── Triangular submerged shape ─────────────────────────────────────────────
// Vertex at top (0, yTop, 0) widening to full halfW at bottom (±halfW, yBot, 0)

function buildTriangleGeometry(yTop: number, yBot: number, halfW: number): THREE.BufferGeometry {
  const N = 24
  const geo = new THREE.BufferGeometry()
  if (Math.abs(yBot - yTop) < 1e-6) return geo

  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []

  const range = yBot - yTop
  const dMax = Math.max(Math.abs(yBot), 0.001)

  for (let i = 0; i <= N; i++) {
    const t = i / N
    const y = yTop + t * range
    const curHalfW = halfW * t  // widens linearly from apex to base
    const depth = -y
    const pt = depth / dMax

    const r = 0.576 - pt * 0.37
    const g = 0.773 - pt * 0.68
    const bv = 0.992 - pt * 0.35

    positions.push(-curHalfW, y, 0)
    colors.push(r, g, bv)
    positions.push(curHalfW, y, 0)
    colors.push(r, g, bv)
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

function PlateMesh({ yTop, yBot, halfW }: { yTop: number; yBot: number; halfW: number }) {
  const geo = useMemo(() => buildPlateGeometry(yTop, yBot, halfW), [yTop, yBot, halfW])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial vertexColors transparent opacity={0.85} side={THREE.DoubleSide} />
    </mesh>
  )
}

function TriangleMesh({ yTop, yBot, halfW }: { yTop: number; yBot: number; halfW: number }) {
  const geo = useMemo(() => buildTriangleGeometry(yTop, yBot, halfW), [yTop, yBot, halfW])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial vertexColors transparent opacity={0.85} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ── Pressure distribution bars (force indicator) ─────────────────────────

function PressureBars({
  yTop, yBot, halfW,
}: { yTop: number; yBot: number; halfW: number }) {
  const bars = useMemo(() => {
    const n = 10
    const dMin = Math.abs(yTop)
    const dMax = Math.abs(yBot)
    const pMax = dMax
    const scale = 1.4
    return Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n
      const d = dMin + t * (dMax - dMin)
      const y_i = -d
      const len = pMax > 0 ? (d / pMax) * scale : 0
      return { y: y_i, len, t }
    })
  }, [yTop, yBot])

  return (
    <>
      {bars.map(({ y, len, t }, i) => (
        <Line
          key={i}
          points={[[halfW, y, 0], [halfW + len, y, 0]] as V3[]}
          color={t < 0.4 ? '#60a5fa' : t < 0.75 ? '#818cf8' : '#6366f1'}
          lineWidth={1.8}
        />
      ))}
      {/* Pressure envelope outline */}
      {bars.length >= 2 && (
        <Line
          points={bars.map(({ y, len }) => [halfW + len, y, 0] as V3)}
          color="#a5b4fc"
          lineWidth={1}
        />
      )}
    </>
  )
}

// ── Scene content ─────────────────────────────────────────────────────────

function FPContent({ paradigm, depth, width, h }: FluidPressureSceneProps) {
  const depthSafe = Math.max(0, depth)
  const widthSafe = Math.max(0.5, width)
  const hSafe = Math.max(0.5, h)

  const isFlat = paradigm === 'flat-plate'

  // y-coordinates (surface = 0, deeper = more negative)
  const yTop = isFlat ? 0 : -depthSafe
  const yBot = isFlat ? -depthSafe : -(depthSafe + hSafe)
  const halfW = isFlat ? widthSafe / 2 : hSafe / 2

  // Hydrostatic force (normalized: ρg = 1)
  // F = ∫_{dTop}^{dBot} d · W(d) · dd   where d = depth from surface, W = width
  const force = useMemo(() => {
    if (isFlat) {
      // flat-plate: W = width, dTop = 0, dBot = depth
      return widthSafe * depthSafe * depthSafe / 2
    } else {
      // submerged rectangle: W = hSafe, dTop = depthSafe, dBot = depthSafe + hSafe
      return hSafe * ((depthSafe + hSafe) ** 2 - depthSafe ** 2) / 2
    }
  }, [isFlat, widthSafe, hSafe, depthSafe])

  const tankTop = 0.5
  const tankBot = yBot - 0.6
  const tankW = halfW + 1.0

  // Water surface semi-transparent plane
  const waterPts = useMemo((): V3[] => [
    [-tankW, 0.02, 0], [tankW, 0.02, 0],
  ], [tankW])

  // Tank wireframe
  const tankLines = useMemo(() => [
    // top
    [[-tankW, tankTop, 0], [tankW, tankTop, 0]] as V3[],
    // bottom
    [[-tankW, tankBot, 0], [tankW, tankBot, 0]] as V3[],
    // left wall
    [[-tankW, tankTop, 0], [-tankW, tankBot, 0]] as V3[],
    // right wall (before pressure bars)
    [[tankW, tankTop, 0], [tankW, tankBot, 0]] as V3[],
  ], [tankW, tankTop, tankBot])

  const labelY = yBot - 0.3
  const midX = halfW / 2

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 2, 5]} intensity={1.2} />
      <directionalLight position={[-2, -3, -4]} intensity={0.4} />

      {/* Plate mesh */}
      {isFlat ? (
        <PlateMesh yTop={yTop} yBot={yBot} halfW={halfW} />
      ) : (
        <TriangleMesh yTop={yTop} yBot={yBot} halfW={halfW} />
      )}

      {/* Plate outline */}
      <Line
        points={[
          [-halfW, yTop, 0], [halfW, yTop, 0],
          [halfW, yBot, 0], [-halfW, yBot, 0],
          [-halfW, yTop, 0],
        ] as V3[]}
        color="#93c5fd"
        lineWidth={1.5}
      />

      {/* Pressure bars */}
      {depthSafe > 0 && <PressureBars yTop={yTop} yBot={yBot} halfW={halfW} />}

      {/* Water surface line */}
      <Line points={waterPts} color="#38bdf8" lineWidth={2} />

      {/* Tank wireframe */}
      {tankLines.map((pts, i) => (
        <Line key={i} points={pts} color="#1e3a5f" lineWidth={1} />
      ))}

      {/* Depth arrow on left side of plate */}
      {depthSafe > 0 && (
        <Line
          points={[
            [-halfW - 0.4, 0, 0],
            [-halfW - 0.4, yBot, 0],
          ] as V3[]}
          color="#374151"
          lineWidth={1}
        />
      )}

      {/* Force label */}
      <Html position={[midX + 0.5, labelY, 0]}>
        <div
          style={{
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            background: 'rgba(0,0,0,0.65)',
            borderRadius: 6,
            padding: '4px 10px',
            minWidth: 200,
          }}
        >
          <div style={{ color: '#38bdf8', fontSize: 12, fontWeight: 700 }}>
            Hydrostatic Force
          </div>
          <div style={{ color: '#a5b4fc', fontSize: 11, marginTop: 2 }}>
            F = {force.toFixed(3)} (ρg = 1)
          </div>
          <div style={{ color: '#6b7280', fontSize: 10, marginTop: 1 }}>
            {isFlat
              ? `F = ½ρgwD² = ½·${widthSafe.toFixed(1)}·${depthSafe.toFixed(1)}²`
              : `F = ρg·w·∫ d·dd  (d₀=${depthSafe.toFixed(1)}, h=${hSafe.toFixed(1)})`}
          </div>
        </div>
      </Html>

      {/* Surface label */}
      <Html position={[tankW - 0.5, 0.2, 0]}>
        <div style={{ color: '#38bdf8', fontSize: 10, pointerEvents: 'none', userSelect: 'none' }}>
          surface
        </div>
      </Html>
    </>
  )
}

// ── Public component ──────────────────────────────────────────────────────

export function FluidPressureScene({ paradigm, depth, width, h }: FluidPressureSceneProps) {
  const depthSafe = Math.max(0, depth)
  const hSafe = Math.max(0.5, h)
  const totalD = paradigm === 'flat-plate' ? depthSafe : depthSafe + hSafe
  const camY = -(totalD / 2)
  const camZ = Math.max(6, totalD + 5)
  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [2.5, camY, camZ], fov: 48 }}
      style={{ width: '100%', height: '100%' }}
    >
      <FPContent paradigm={paradigm} depth={depth} width={width} h={h} />
      <OrbitControls makeDefault />
    </Canvas>
  )
}
