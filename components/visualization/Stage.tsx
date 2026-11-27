'use client'

import { Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { CameraControls, ContactShadows, Environment, Grid, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { fitDistance, needsRefit, type CameraPreset } from './framing'

export type { CameraPreset }
export type Vec3 = [number, number, number]

const FOV = 38
const MARGIN = 1.02
const BACKGROUND = '#060912'

export interface StageProps {
  /** Axis-aligned box the camera must keep in view. */
  bounds: { min: Vec3; max: Vec3 }
  preset: CameraPreset
  /** View direction for the 3D preset (from target toward camera). */
  direction3d?: Vec3
  children: ReactNode
}

const PRESET_DIRECTIONS: Record<Exclude<CameraPreset, '3d'>, Vec3> = {
  side: [0, 0, 1],
  top: [0, 1, 0.0001],
}

function sphereOf(bounds: StageProps['bounds']) {
  const box = new THREE.Box3(new THREE.Vector3(...bounds.min), new THREE.Vector3(...bounds.max))
  const sphere = box.getBoundingSphere(new THREE.Sphere())
  if (!(sphere.radius > 0.25)) sphere.radius = 0.25
  return sphere
}

function Framing({ sphere, preset, direction3d }: { sphere: THREE.Sphere; preset: CameraPreset; direction3d: Vec3 }) {
  const controls = useRef<CameraControls>(null)
  const { size } = useThree()
  const fitted = useRef<{ radius: number; preset: CameraPreset } | null>(null)

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const last = fitted.current
    const presetChanged = !last || last.preset !== preset
    if (!presetChanged && !needsRefit(last.radius, sphere.radius)) return

    const dir = new THREE.Vector3()
    if (presetChanged) {
      dir.set(...(preset === '3d' ? direction3d : PRESET_DIRECTIONS[preset]))
    } else {
      c.getPosition(dir).sub(c.getTarget(new THREE.Vector3()))
    }
    dir.normalize()
    const dist = fitDistance(sphere.radius, FOV, size.width / Math.max(1, size.height), MARGIN)
    const pos = sphere.center.clone().addScaledVector(dir, dist)
    c.setLookAt(pos.x, pos.y, pos.z, sphere.center.x, sphere.center.y, sphere.center.z, last !== null)
    c.minDistance = dist * 0.25
    c.maxDistance = dist * 4
    fitted.current = { radius: sphere.radius, preset }
  }, [sphere, preset, direction3d, size.width, size.height])

  return <CameraControls ref={controls} makeDefault smoothTime={0.35} />
}

/** Shared studio for every topic: lighting, reflections, floor, shadows and auto-framing camera. */
export function Stage({ bounds, preset, direction3d = [1, 0.65, 1.5], children }: StageProps) {
  const key = `${bounds.min.join()}|${bounds.max.join()}`
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sphere = useMemo(() => sphereOf(bounds), [key])
  const floorY = bounds.min[1] - sphere.radius * 0.08
  const r = sphere.radius

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: FOV, near: 0.01, far: 1000, position: [r * 3, r * 2, r * 4] }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, r * 6, r * 14]} />

      <hemisphereLight args={['#dbeafe', '#0b1220', 0.55]} />
      <directionalLight position={[r * 2, r * 4, r * 3]} intensity={2.2} />
      <directionalLight position={[-r * 3, r * 1.5, -r * 2]} intensity={1.1} color="#60a5fa" />

      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.5} position={[0, 5, 2]} scale={[8, 3, 1]} rotation-x={Math.PI / 2.4} />
        <Lightformer form="rect" intensity={1.2} color="#93c5fd" position={[-6, 1, -2]} scale={[4, 6, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="ring" intensity={1.5} color="#c4b5fd" position={[6, 2, 3]} scale={3} rotation-y={-Math.PI / 2} />
      </Environment>

      <Grid
        position={[sphere.center.x, floorY, sphere.center.z]}
        infiniteGrid
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#16213a"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#24365c"
        fadeDistance={r * 9}
        fadeStrength={1.6}
      />
      <ContactShadows
        position={[sphere.center.x, floorY + 0.002, sphere.center.z]}
        scale={r * 4}
        far={r * 2.5}
        blur={2.4}
        opacity={0.55}
        resolution={512}
        color="#000000"
      />

      <Framing sphere={sphere} preset={preset} direction3d={direction3d} />
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  )
}
