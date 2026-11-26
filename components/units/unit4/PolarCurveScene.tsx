'use client'

import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { polarCurvePoints } from '@/lib/math/geometry/polar'

interface PolarCurveSceneProps {
  rFn: string
  thetaMin: number
  thetaMax: number
  n?: number
  color?: string
}

export function PolarCurveScene({
  rFn,
  thetaMin,
  thetaMax,
  n = 400,
  color = '#34d399',
}: PolarCurveSceneProps) {
  const geometry = useMemo(() => {
    const pts = polarCurvePoints(rFn, thetaMin, thetaMax, n)
    if (pts.length < 2) return null
    const vectors = pts.map((p) => new THREE.Vector3(p.x, p.y, 0))
    return new THREE.BufferGeometry().setFromPoints(vectors)
  }, [rFn, thetaMin, thetaMax, n])

  useEffect(() => { return () => { geometry?.dispose?.() } }, [geometry])

  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      {geometry && (
        <line>
          <bufferGeometry attach="geometry" {...geometry} />
          <lineBasicMaterial attach="material" color={color} linewidth={2} />
        </line>
      )}
      {/* Axes */}
      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-3, 0, 0),
            new THREE.Vector3(3, 0, 0),
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
