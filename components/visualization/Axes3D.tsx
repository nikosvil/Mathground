'use client'

import type { ReactNode } from 'react'
import { Billboard, Text } from '@react-three/drei'

export const FONT_MAIN = '/fonts/KaTeX_Main-Regular.woff'
export const FONT_MATH = '/fonts/KaTeX_Math-Italic.woff'

type Vec3 = [number, number, number]

interface LabelProps {
  position: Vec3
  children: ReactNode
  size: number
  color?: string
  italic?: boolean
  anchorX?: 'left' | 'center' | 'right'
  anchorY?: 'top' | 'middle' | 'bottom'
  /** Draw on top of geometry so annotations inside a solid stay readable. */
  overlay?: boolean
}

/** Camera-facing text rendered in WebGL (no DOM overlay). */
export function Label({ position, children, size, color = '#e2e8f0', italic = false, anchorX = 'center', anchorY = 'middle', overlay = false }: LabelProps) {
  return (
    <Billboard position={position}>
      <Text
        font={italic ? FONT_MATH : FONT_MAIN}
        fontSize={size}
        color={color}
        anchorX={anchorX}
        anchorY={anchorY}
        outlineWidth={size * 0.08}
        outlineColor="#060912"
        renderOrder={overlay ? 20 : 0}
      >
        {children}
        {overlay && <meshBasicMaterial attach="material" depthTest={false} depthWrite={false} transparent />}
      </Text>
    </Billboard>
  )
}

const ROTATION: Record<'x' | 'y' | 'z', Vec3> = {
  x: [0, 0, -Math.PI / 2],
  y: [0, 0, 0],
  z: [Math.PI / 2, 0, 0],
}

function along(axis: 'x' | 'y' | 'z', t: number): Vec3 {
  return axis === 'x' ? [t, 0, 0] : axis === 'y' ? [0, t, 0] : [0, 0, t]
}

interface AxisProps {
  axis: 'x' | 'y' | 'z'
  range: [number, number]
  unit: number
  color: string
  label: string
  ticks?: number[]
}

function Axis({ axis, range, unit, color, label, ticks = [] }: AxisProps) {
  const [lo, hi] = range
  const thick = unit * 0.007
  const head = unit * 0.05
  const len = hi - lo
  const tickOffset: Vec3 = axis === 'y' ? [-unit * 0.07, 0, 0] : [0, -unit * 0.08, 0]

  return (
    <group>
      <mesh position={along(axis, lo + len / 2)} rotation={ROTATION[axis]}>
        <cylinderGeometry args={[thick, thick, len, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={along(axis, hi + head / 2)} rotation={ROTATION[axis]}>
        <coneGeometry args={[head * 0.38, head, 20]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <Label position={along(axis, hi + head * 1.9)} size={unit * 0.075} color={color} italic>
        {label}
      </Label>
      {ticks.map(t => {
        const p = along(axis, t)
        return (
          <group key={t}>
            <mesh position={p}>
              <sphereGeometry args={[thick * 2.2, 10, 10]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <Label position={[p[0] + tickOffset[0], p[1] + tickOffset[1], p[2] + tickOffset[2]]} size={unit * 0.05} color="#94a3b8">
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </Label>
          </group>
        )
      })}
    </group>
  )
}

export interface Axes3DProps {
  x?: [number, number]
  y?: [number, number]
  z?: [number, number]
  /** Scene size; sets axis thickness and label size. */
  unit: number
  xTicks?: number[]
  yTicks?: number[]
}

export function Axes3D({ x, y, z, unit, xTicks, yTicks }: Axes3DProps) {
  return (
    <group>
      {x && <Axis axis="x" range={x} unit={unit} color="#f87171" label="x" ticks={xTicks} />}
      {y && <Axis axis="y" range={y} unit={unit} color="#4ade80" label="y" ticks={yTicks} />}
      {z && <Axis axis="z" range={z} unit={unit} color="#60a5fa" label="z" />}
    </group>
  )
}

/** Integer tick positions inside [lo, hi], thinned to at most `max` ticks. */
export function integerTicks(lo: number, hi: number, max = 8): number[] {
  const start = Math.ceil(lo)
  const end = Math.floor(hi)
  if (end < start) return []
  const step = Math.max(1, Math.ceil((end - start + 1) / max))
  const out: number[] = []
  for (let t = start; t <= end; t += step) if (t !== 0) out.push(t)
  return out
}
