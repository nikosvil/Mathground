'use client'

import { useMemo, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { parseExpression } from '@/lib/math/parser'
import { diskGeometry, washerGeometry, shellGeometry } from '@/lib/math/geometry/revolution'
import { AxisLabels } from '@/components/visualization/AxisLabels'

type CameraPreset = '3d' | 'side' | 'top'

const PRESET_CONFIG: Record<CameraPreset, { position: [number, number, number]; rotate: boolean }> = {
  '3d':  { position: [4, 3, 5],   rotate: true },
  side:  { position: [0, 0, 7],   rotate: false },
  top:   { position: [0, 7, 0.5], rotate: false },
}

interface VolumesRevolutionSceneProps {
  paradigm: 'disk' | 'washer' | 'shell'
  sliderValues: Record<string, number>
  fn: string
  innerFn?: string
  cameraPreset?: CameraPreset
}

function SceneControls({ preset }: { preset: CameraPreset }) {
  const { camera } = useThree()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)
  const { rotate } = PRESET_CONFIG[preset]

  useEffect(() => {
    const { position } = PRESET_CONFIG[preset]
    camera.position.set(position[0], position[1], position[2])
    camera.lookAt(0, 0, 0)
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }
  }, [preset, camera])

  return <OrbitControls ref={controlsRef} enableRotate={rotate} makeDefault />
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
  const preset = props.cameraPreset ?? '3d'
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [4, 3, 5], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <SceneControls preset={preset} />
        <AxisLabels />
        <RevolutionMesh {...props} />
      </Canvas>
    </div>
  )
}
