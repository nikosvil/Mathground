'use client'

import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { partialSumPoints } from '@/lib/math/geometry/series'

interface PartialSumsSceneProps {
  termFn: (n: number) => number
  numTerms: number
  label?: string
}

function Bars({ data }: { data: { n: number; partialSum: number }[] }) {
  const meshes = useMemo(() => {
    return data.map((pt) => {
      const height = Math.abs(pt.partialSum)
      const y = pt.partialSum / 2
      return { n: pt.n, height, y, sum: pt.partialSum }
    })
  }, [data])

  const scale = useMemo(() => {
    const maxH = Math.max(...meshes.map((m) => m.height), 1)
    return maxH > 10 ? 10 / maxH : 1
  }, [meshes])

  return (
    <>
      {meshes.map((m) => (
        <mesh key={m.n} position={[m.n * 0.5, (m.y * scale) / 2, 0]}>
          <boxGeometry args={[0.4, Math.max(m.height * scale, 0.01), 0.1]} />
          <meshStandardMaterial color="#60a5fa" transparent opacity={0.8} />
        </mesh>
      ))}
    </>
  )
}

export function PartialSumsScene({ termFn, numTerms, label }: PartialSumsSceneProps) {
  const data = useMemo(() => partialSumPoints(termFn, numTerms), [termFn, numTerms])

  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [numTerms * 0.25, 5, 15], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} />
      <Bars data={data} />
      {label && (
        <Html position={[0, 8, 0]}>
          <span className="text-sm text-gray-300">{label}</span>
        </Html>
      )}
      {/* X axis */}
      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(numTerms * 0.5 + 1, 0, 0),
          ])}
        />
        <lineBasicMaterial attach="material" color="#6b7280" />
      </line>
      <OrbitControls />
    </Canvas>
  )
}
