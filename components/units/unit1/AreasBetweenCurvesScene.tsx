'use client'

import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { parseExpression } from '@/lib/math/parser'

interface AreasBetweenCurvesSceneProps {
  fnTop: string
  fnBottom: string
  a: number
  b: number
  n?: number
}

function FilledArea({ fnTop, fnBottom, a, b, n = 200 }: AreasBetweenCurvesSceneProps) {
  const geometry = useMemo(() => {
    const pTop = parseExpression(fnTop, ['x'])
    const pBot = parseExpression(fnBottom, ['x'])
    if (!pTop.valid || !pTop.fn || !pBot.valid || !pBot.fn) return null

    const step = (b - a) / n
    const topPts: { x: number; y: number }[] = []
    const botPts: { x: number; y: number }[] = []

    for (let i = 0; i <= n; i++) {
      const x = a + i * step
      const yt = pTop.fn({ x })
      const yb = pBot.fn({ x })
      if (isFinite(yt) && isFinite(yb) && Math.abs(yt) < 50 && Math.abs(yb) < 50) {
        topPts.push({ x, y: yt })
        botPts.push({ x, y: yb })
      }
    }

    if (topPts.length < 2) return null

    const shape = new THREE.Shape()
    shape.moveTo(topPts[0].x, topPts[0].y)
    for (let i = 1; i < topPts.length; i++) shape.lineTo(topPts[i].x, topPts[i].y)
    for (let i = botPts.length - 1; i >= 0; i--) shape.lineTo(botPts[i].x, botPts[i].y)
    shape.closePath()

    return new THREE.ShapeGeometry(shape)
  }, [fnTop, fnBottom, a, b, n])

  useEffect(() => () => { geometry?.dispose?.() }, [geometry])
  if (!geometry) return null

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

function Curve({ fn, xMin, xMax, color, n = 300 }: { fn: string; xMin: number; xMax: number; color: string; n?: number }) {
  const geometry = useMemo(() => {
    const p = parseExpression(fn, ['x'])
    if (!p.valid || !p.fn) return null
    const pts: THREE.Vector3[] = []
    const step = (xMax - xMin) / n
    for (let i = 0; i <= n; i++) {
      const x = xMin + i * step
      const y = p.fn({ x })
      if (isFinite(y) && Math.abs(y) < 50) pts.push(new THREE.Vector3(x, y, 0.01))
    }
    return pts.length >= 2 ? new THREE.BufferGeometry().setFromPoints(pts) : null
  }, [fn, xMin, xMax, n])

  useEffect(() => () => { geometry?.dispose?.() }, [geometry])
  if (!geometry) return null

  return (
    <line>
      <bufferGeometry attach="geometry" {...geometry} />
      <lineBasicMaterial attach="material" color={color} linewidth={2} />
    </line>
  )
}

export function AreasBetweenCurvesScene({ fnTop, fnBottom, a, b, n = 200 }: AreasBetweenCurvesSceneProps) {
  const margin = Math.max((b - a) * 0.3, 0.5)
  const xMin = a - margin
  const xMax = b + margin

  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [(a + b) / 2, 0, 10], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <FilledArea fnTop={fnTop} fnBottom={fnBottom} a={a} b={b} n={n} />
      <Curve fn={fnTop} xMin={xMin} xMax={xMax} color="#60a5fa" />
      <Curve fn={fnBottom} xMin={xMin} xMax={xMax} color="#f97316" />
      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(xMin - 0.5, 0, 0),
            new THREE.Vector3(xMax + 0.5, 0, 0),
          ])}
        />
        <lineBasicMaterial attach="material" color="#6b7280" />
      </line>
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
