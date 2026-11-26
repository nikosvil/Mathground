'use client'

import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { parseExpression } from '@/lib/math/parser'

interface SequenceSceneProps {
  termFn: string
  N: number
}

function SequenceDots({ termFn, N }: SequenceSceneProps) {
  const geometry = useMemo(() => {
    const p = parseExpression(termFn, ['n'])
    if (!p.valid || !p.fn) return null

    const pts: THREE.Vector3[] = []
    for (let n = 1; n <= N; n++) {
      const y = p.fn({ n })
      if (!isFinite(y) || Math.abs(y) > 100) continue
      pts.push(new THREE.Vector3(n, y, 0))
    }

    if (pts.length === 0) return null
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [termFn, N])

  useEffect(() => () => { geometry?.dispose?.() }, [geometry])
  if (!geometry) return null

  return (
    <points geometry={geometry}>
      <pointsMaterial color="#60a5fa" size={0.15} sizeAttenuation />
    </points>
  )
}

function LimitLine({ termFn, N }: SequenceSceneProps) {
  const limit = useMemo(() => {
    const p = parseExpression(termFn, ['n'])
    if (!p.valid || !p.fn) return null
    const y = p.fn({ n: N })
    return isFinite(y) && Math.abs(y) < 100 ? y : null
  }, [termFn, N])

  if (limit === null || Math.abs(limit) > 10) return null

  return (
    <line>
      <bufferGeometry
        attach="geometry"
        {...new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, limit, 0),
          new THREE.Vector3(N + 1, limit, 0),
        ])}
      />
      <lineBasicMaterial attach="material" color="#10b981" />
    </line>
  )
}

export function SequenceScene({ termFn, N }: SequenceSceneProps) {
  const camX = N / 2 + 0.5
  const camZ = Math.max(N * 0.6, 5)

  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [camX, 0, camZ], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <SequenceDots termFn={termFn} N={N} />
      <LimitLine termFn={termFn} N={N} />
      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(N + 1, 0, 0),
          ])}
        />
        <lineBasicMaterial attach="material" color="#6b7280" />
      </line>
      <OrbitControls enableRotate={false} />
    </Canvas>
  )
}
