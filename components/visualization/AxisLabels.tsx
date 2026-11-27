'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'

type Vec3 = [number, number, number]

export function makeAxisGeometry(from: Vec3, to: Vec3): THREE.BufferGeometry {
  return new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...from), new THREE.Vector3(...to)])
}

interface AxisLabelsProps {
  xLabel?: string
  yLabel?: string
  zLabel?: string
  extent?: number
}

export function AxisLabels({ xLabel = 'x', yLabel = 'y', zLabel = 'z', extent = 3 }: AxisLabelsProps) {
  const axes = useMemo(
    () => [
      { geo: makeAxisGeometry([-extent, 0, 0], [extent, 0, 0]), color: '#ef4444', label: xLabel, pos: [extent + 0.3, 0, 0] as Vec3, cls: 'text-red-400' },
      { geo: makeAxisGeometry([0, -extent, 0], [0, extent, 0]), color: '#22c55e', label: yLabel, pos: [0, extent + 0.3, 0] as Vec3, cls: 'text-green-400' },
      { geo: makeAxisGeometry([0, 0, -extent], [0, 0, extent]), color: '#3b82f6', label: zLabel, pos: [0, 0, extent + 0.3] as Vec3, cls: 'text-blue-400' },
    ],
    [extent, xLabel, yLabel, zLabel],
  )

  return (
    <>
      {axes.map(a => (
        <group key={a.color}>
          <lineSegments geometry={a.geo}>
            <lineBasicMaterial color={a.color} />
          </lineSegments>
          <Html position={a.pos}>
            <span className={`select-none text-sm font-semibold ${a.cls}`}>{a.label}</span>
          </Html>
        </group>
      ))}
    </>
  )
}
