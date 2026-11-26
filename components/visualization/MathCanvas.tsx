'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { ReactNode } from 'react'

interface MathCanvasProps {
  children: ReactNode
  className?: string
}

export function MathCanvas({ children, className = '' }: MathCanvasProps) {
  return (
    <div className={`relative h-full w-full ${className}`}>
      <Canvas
        camera={{ position: [5, 4, 6], fov: 50 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <OrbitControls makeDefault enablePan enableZoom enableRotate />
        {children}
      </Canvas>
    </div>
  )
}
