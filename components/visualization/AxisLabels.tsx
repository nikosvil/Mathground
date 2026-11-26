'use client'

import * as THREE from 'three'
import { Html } from '@react-three/drei'

interface AxisLabelsProps {
  xLabel?: string
  yLabel?: string
  zLabel?: string
  extent?: number
}

export function AxisLabels({ xLabel = 'x', yLabel = 'y', zLabel = 'z', extent = 3 }: AxisLabelsProps) {
  return (
    <>
      {/* X axis */}
      <line>
        <bufferGeometry
          onUpdate={(geo: THREE.BufferGeometry) => {
            const pts = new Float32Array([-extent, 0, 0, extent, 0, 0])
            geo.setAttribute('position', { array: pts, count: 2, itemSize: 3 } as never)
          }}
        />
        <lineBasicMaterial color="#ef4444" />
      </line>
      <Html position={[extent + 0.3, 0, 0]}>
        <span className="select-none text-sm font-semibold text-red-400">{xLabel}</span>
      </Html>

      {/* Y axis */}
      <line>
        <bufferGeometry
          onUpdate={(geo: THREE.BufferGeometry) => {
            const pts = new Float32Array([0, -extent, 0, 0, extent, 0])
            geo.setAttribute('position', { array: pts, count: 2, itemSize: 3 } as never)
          }}
        />
        <lineBasicMaterial color="#22c55e" />
      </line>
      <Html position={[0, extent + 0.3, 0]}>
        <span className="select-none text-sm font-semibold text-green-400">{yLabel}</span>
      </Html>

      {/* Z axis */}
      <line>
        <bufferGeometry
          onUpdate={(geo: THREE.BufferGeometry) => {
            const pts = new Float32Array([0, 0, -extent, 0, 0, extent])
            geo.setAttribute('position', { array: pts, count: 2, itemSize: 3 } as never)
          }}
        />
        <lineBasicMaterial color="#3b82f6" />
      </line>
      <Html position={[0, 0, extent + 0.3]}>
        <span className="select-none text-sm font-semibold text-blue-400">{zLabel}</span>
      </Html>
    </>
  )
}
