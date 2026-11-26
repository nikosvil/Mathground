'use client'

import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { parseExpression } from '@/lib/math/parser'
import { diskGeometry, washerGeometry, shellGeometry } from '@/lib/math/geometry/revolution'
import { AxisLabels } from '@/components/visualization/AxisLabels'

interface VolumesRevolutionSceneProps {
  paradigm: 'disk' | 'washer' | 'shell'
  sliderValues: Record<string, number>
  fn: string
  innerFn?: string
}

function RevolutionMesh({ paradigm, sliderValues, fn, innerFn }: VolumesRevolutionSceneProps) {
  const geometry = useMemo(() => {
    const a = sliderValues.a ?? 0
    const b = sliderValues.b ?? 1
    const n = Math.round(sliderValues.n ?? 20)

    const outerResult = parseExpression(fn, ['x'])
    if (!outerResult.valid || !outerResult.fn) return null

    if (paradigm === 'disk') {
      return diskGeometry(outerResult.fn, a, b, n, 'x', 0)
    }

    if (paradigm === 'washer') {
      const innerResult = parseExpression(innerFn ?? '0', ['x'])
      if (!innerResult.valid || !innerResult.fn) return null
      return washerGeometry(outerResult.fn, innerResult.fn, a, b, n)
    }

    if (paradigm === 'shell') {
      return shellGeometry(outerResult.fn, a, b, n)
    }

    return null
  }, [paradigm, sliderValues, fn, innerFn])

  useEffect(() => { return () => { geometry?.dispose?.() } }, [geometry])

  if (!geometry) return null

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={paradigm === 'shell' ? '#f59e0b' : '#3b82f6'}
        side={THREE.DoubleSide}
        transparent
        opacity={0.75}
        wireframe={false}
      />
    </mesh>
  )
}

export function VolumesRevolutionScene(props: VolumesRevolutionSceneProps) {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [4, 3, 5], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <OrbitControls makeDefault />
        <AxisLabels />
        <RevolutionMesh {...props} />
      </Canvas>
    </div>
  )
}
