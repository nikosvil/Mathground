'use client'

import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { parseExpression } from '@/lib/math/parser'

interface NumericalIntegrationSceneProps {
  fn: string
  a: number
  b: number
  n: number
  method?: 'left' | 'right' | 'midpoint'
}

function RiemannRects({ fn, a, b, n, method = 'midpoint' }: NumericalIntegrationSceneProps) {
  const { fillGeo, lineGeo } = useMemo(() => {
    const p = parseExpression(fn, ['x'])
    if (!p.valid || !p.fn) return { fillGeo: null, lineGeo: null }

    const step = (b - a) / n
    const fillVerts: number[] = []
    const fillIdx: number[] = []
    const lineVerts: number[] = []
    let vi = 0

    for (let i = 0; i < n; i++) {
      const x0 = a + i * step
      const x1 = x0 + step
      const xSample =
        method === 'left' ? x0 : method === 'right' ? x1 : (x0 + x1) / 2
      const h = p.fn({ x: xSample })
      if (!isFinite(h) || Math.abs(h) > 50) continue

      const yLow = Math.min(0, h)
      const yHigh = Math.max(0, h)

      // Fill quad: bottom-left, bottom-right, top-right, top-left
      fillVerts.push(x0, yLow, 0, x1, yLow, 0, x1, yHigh, 0, x0, yHigh, 0)
      fillIdx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3)
      vi += 4

      // Outline: left edge, top edge, right edge (skip bottom edge = x-axis)
      lineVerts.push(
        x0, yLow, 0.01, x0, yHigh, 0.01,
        x0, yHigh, 0.01, x1, yHigh, 0.01,
        x1, yHigh, 0.01, x1, yLow, 0.01,
      )
    }

    const fill = new THREE.BufferGeometry()
    fill.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fillVerts), 3))
    fill.setIndex(new THREE.BufferAttribute(new Uint16Array(fillIdx), 1))

    const lines = new THREE.BufferGeometry()
    lines.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lineVerts), 3))

    return { fillGeo: fill, lineGeo: lines }
  }, [fn, a, b, n, method])

  useEffect(() => () => { fillGeo?.dispose?.(); lineGeo?.dispose?.() }, [fillGeo, lineGeo])

  return (
    <>
      {fillGeo && (
        <mesh geometry={fillGeo}>
          <meshBasicMaterial color="#f97316" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      {lineGeo && (
        <lineSegments geometry={lineGeo}>
          <lineBasicMaterial color="#f97316" />
        </lineSegments>
      )}
    </>
  )
}

function FunctionCurve({ fn, xMin, xMax }: { fn: string; xMin: number; xMax: number }) {
  const geometry = useMemo(() => {
    const p = parseExpression(fn, ['x'])
    if (!p.valid || !p.fn) return null
    const pts: THREE.Vector3[] = []
    const steps = 300
    const step = (xMax - xMin) / steps
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step
      const y = p.fn({ x })
      if (isFinite(y) && Math.abs(y) < 50) pts.push(new THREE.Vector3(x, y, 0.02))
    }
    return pts.length >= 2 ? new THREE.BufferGeometry().setFromPoints(pts) : null
  }, [fn, xMin, xMax])

  useEffect(() => () => { geometry?.dispose?.() }, [geometry])
  if (!geometry) return null

  return (
    <line>
      <bufferGeometry attach="geometry" {...geometry} />
      <lineBasicMaterial attach="material" color="#60a5fa" linewidth={2} />
    </line>
  )
}

export function NumericalIntegrationScene({
  fn,
  a,
  b,
  n,
  method = 'midpoint',
}: NumericalIntegrationSceneProps) {
  const midX = (a + b) / 2
  const range = Math.max(b - a, 2)

  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [midX, 0.5, range * 1.5 + 3], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <RiemannRects fn={fn} a={a} b={b} n={n} method={method} />
      <FunctionCurve fn={fn} xMin={a - 0.5} xMax={b + 0.5} />
      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(a - 1, 0, 0),
            new THREE.Vector3(b + 1, 0, 0),
          ])}
        />
        <lineBasicMaterial attach="material" color="#6b7280" />
      </line>
      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -3, 0),
            new THREE.Vector3(0, 3, 0),
          ])}
        />
        <lineBasicMaterial attach="material" color="#6b7280" />
      </line>
      <OrbitControls enableRotate={false} />
    </Canvas>
  )
}
