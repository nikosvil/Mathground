'use client'

import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { parseExpression } from '@/lib/math/parser'
import { taylorPoints } from '@/lib/math/geometry/series'

interface TaylorSeriesSceneProps {
  fn: string
  x0: number
  degree: number
  xMin: number
  xMax: number
}

function PointsCurve({ points, color }: { points: { x: number; y: number }[]; color: string }) {
  const geometry = useMemo(() => {
    const pts = points
      .filter((p) => isFinite(p.y) && Math.abs(p.y) < 50)
      .map((p) => new THREE.Vector3(p.x, p.y, 0))
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [points])

  if (points.length < 2) return null
  return (
    <line>
      <bufferGeometry attach="geometry" {...geometry} />
      <lineBasicMaterial attach="material" color={color} linewidth={2} />
    </line>
  )
}

export function TaylorSeriesScene({ fn, x0, degree, xMin, xMax }: TaylorSeriesSceneProps) {
  const originalPoints = useMemo(() => {
    const parsed = parseExpression(fn, ['x'])
    if (!parsed.valid || !parsed.fn) return []
    const n = 200
    const step = (xMax - xMin) / n
    return Array.from({ length: n + 1 }, (_, i) => {
      const x = xMin + i * step
      return { x, y: parsed.fn!({ x }) }
    })
  }, [fn, xMin, xMax])

  const taylorPts = useMemo(
    () => taylorPoints(fn, x0, degree, xMin, xMax, 200),
    [fn, x0, degree, xMin, xMax]
  )

  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [0, 0, 12], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <PointsCurve points={originalPoints} color="#60a5fa" />
      <PointsCurve points={taylorPts} color="#f59e0b" />
      {/* Axes */}
      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(xMin, 0, 0),
            new THREE.Vector3(xMax, 0, 0),
          ])}
        />
        <lineBasicMaterial attach="material" color="#6b7280" />
      </line>
      <OrbitControls enableRotate={false} />
    </Canvas>
  )
}
