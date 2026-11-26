'use client'

import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

type WaveType = 'square-wave' | 'sawtooth'

interface FourierSeriesSceneProps {
  waveType: WaveType
  N: number
}

// Partial Fourier sum for the given wave type
function fourierSum(waveType: WaveType, N: number, x: number): number {
  if (waveType === 'square-wave') {
    // (4/π) Σ_{k=0}^{N-1} sin((2k+1)x) / (2k+1)
    let s = 0
    for (let k = 0; k < N; k++) {
      const m = 2 * k + 1
      s += Math.sin(m * x) / m
    }
    return (4 / Math.PI) * s
  } else {
    // sawtooth: (2/π) Σ_{k=1}^{N} (-1)^{k+1} sin(kx) / k
    let s = 0
    for (let k = 1; k <= N; k++) {
      s += (k % 2 === 1 ? 1 : -1) * Math.sin(k * x) / k
    }
    return (2 / Math.PI) * s
  }
}

// Exact (target) wave value at x
function exactWave(waveType: WaveType, x: number): number {
  const period = 2 * Math.PI
  let xn = ((x % period) + period) % period // into [0, 2π)
  if (xn > Math.PI) xn -= period            // into (-π, π]
  if (waveType === 'square-wave') return xn > 0 ? 1 : xn < 0 ? -1 : 0
  return xn / Math.PI
}

// Build a LineSegments geometry for the exact wave (preserves sharp jumps)
function buildReferenceGeometry(waveType: WaveType, xMin: number, xMax: number): THREE.BufferGeometry {
  const eps = 1e-6

  // Collect all discontinuity x-positions inside (xMin, xMax)
  const kMin = Math.ceil(xMin / Math.PI)
  const kMax = Math.floor(xMax / Math.PI)
  const jumps: number[] = []
  for (let k = kMin; k <= kMax; k++) {
    const xj = k * Math.PI
    if (xj <= xMin + eps || xj >= xMax - eps) continue
    if (Math.abs(exactWave(waveType, xj + eps) - exactWave(waveType, xj - eps)) > 0.1) {
      jumps.push(xj)
    }
  }

  const breaks = [xMin, ...jumps, xMax]
  const verts: number[] = []

  for (let i = 0; i < breaks.length - 1; i++) {
    const x0 = breaks[i]
    const x1 = breaks[i + 1]
    const y0 = exactWave(waveType, x0 + eps)
    const y1 = exactWave(waveType, x1 - eps)
    // Horizontal (square) or diagonal (sawtooth) segment
    verts.push(x0, y0, 0, x1, waveType === 'square-wave' ? y0 : y1, 0)
    // Vertical edge at the discontinuity
    if (i < breaks.length - 2) {
      const yEnd = waveType === 'square-wave' ? y0 : y1
      const yNext = exactWave(waveType, breaks[i + 1] + eps)
      verts.push(x1, yEnd, 0, x1, yNext, 0)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3))
  return geo
}

function FourierApproximation({ waveType, N }: FourierSeriesSceneProps) {
  const geometry = useMemo(() => {
    const xMin = -2 * Math.PI, xMax = 2 * Math.PI
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 800; i++) {
      const x = xMin + (i / 800) * (xMax - xMin)
      const y = fourierSum(waveType, N, x)
      if (isFinite(y)) pts.push(new THREE.Vector3(x, y, 0.01))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [waveType, N])

  useEffect(() => () => { geometry.dispose() }, [geometry])

  return (
    <line>
      <bufferGeometry attach="geometry" {...geometry} />
      <lineBasicMaterial attach="material" color="#60a5fa" linewidth={2} />
    </line>
  )
}

function ReferenceWave({ waveType }: { waveType: WaveType }) {
  const geometry = useMemo(
    () => buildReferenceGeometry(waveType, -2 * Math.PI, 2 * Math.PI),
    [waveType],
  )
  useEffect(() => () => { geometry.dispose() }, [geometry])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#9ca3af" transparent opacity={0.5} />
    </lineSegments>
  )
}

export function FourierSeriesScene({ waveType, N }: FourierSeriesSceneProps) {
  const xExtent = 2 * Math.PI
  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [0, 0, 14], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <ReferenceWave waveType={waveType} />
      <FourierApproximation waveType={waveType} N={N} />
      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-(xExtent + 0.5), 0, 0),
            new THREE.Vector3(xExtent + 0.5, 0, 0),
          ])}
        />
        <lineBasicMaterial attach="material" color="#374151" />
      </line>
      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -1.8, 0),
            new THREE.Vector3(0, 1.8, 0),
          ])}
        />
        <lineBasicMaterial attach="material" color="#374151" />
      </line>
      <OrbitControls enableRotate={false} />
    </Canvas>
  )
}
