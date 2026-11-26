'use client'

import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { parseExpression } from '@/lib/math/parser'

interface FunctionPlot2DProps {
  fn: string
  xMin: number
  xMax: number
  label?: string
  n?: number
  color?: string
}

function FunctionCurve({
  fn,
  xMin,
  xMax,
  n = 300,
  color = '#60a5fa',
}: FunctionPlot2DProps & { n?: number }) {
  const points = useMemo(() => {
    const parsed = parseExpression(fn, ['x'])
    if (!parsed.valid || !parsed.fn) return []
    const pts: THREE.Vector3[] = []
    const step = (xMax - xMin) / n
    for (let i = 0; i <= n; i++) {
      const x = xMin + i * step
      const y = parsed.fn({ x })
      if (isFinite(y)) {
        pts.push(new THREE.Vector3(x, y, 0))
      }
    }
    return pts
  }, [fn, xMin, xMax, n])

  if (points.length < 2) return null

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    return geo
  }, [points])

  useEffect(() => { return () => { geometry?.dispose?.() } }, [geometry])

  return (
    <line>
      <bufferGeometry attach="geometry" {...geometry} />
      <lineBasicMaterial attach="material" color={color} linewidth={2} />
    </line>
  )
}

export function FunctionPlot2D({ fn, xMin, xMax, label, n, color }: FunctionPlot2DProps) {
  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [0, 0, 10], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <FunctionCurve fn={fn} xMin={xMin} xMax={xMax} n={n} color={color} />
      {/* X axis */}
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
      {/* Y axis */}
      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -5, 0),
            new THREE.Vector3(0, 5, 0),
          ])}
        />
        <lineBasicMaterial attach="material" color="#6b7280" />
      </line>
      <OrbitControls enableRotate={false} />
    </Canvas>
  )
}
