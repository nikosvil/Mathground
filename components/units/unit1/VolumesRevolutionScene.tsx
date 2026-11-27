'use client'

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { parseExpression } from '@/lib/math/parser'
import {
  latheProfile, regionOutline, slices, solidBounds,
  type RevolutionMethod, type RevolutionSpec, type Slice,
} from '@/lib/math/volumes'
import { Stage, type CameraPreset, type Vec3 } from '@/components/visualization/Stage'
import { Axes3D, Label, integerTicks } from '@/components/visualization/Axes3D'

const SWEEP_SECONDS = 2.6
const SLICE_DELAY = 0.25
const SLICE_STAGGER = 0.045
const SLICE_GROW = 0.35
const PROFILE_SAMPLES = 120
const RADIAL_SEGMENTS = 128

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

type Timeline = MutableRefObject<number>

function sweepAngle(elapsed: number): number {
  return Math.max(0.0001, easeInOut(clamp01(elapsed / SWEEP_SECONDS)) * Math.PI * 2)
}

function totalDuration(n: number): number {
  return SWEEP_SECONDS + SLICE_DELAY + n * SLICE_STAGGER + SLICE_GROW
}

/** Disk/washer solids revolve about a horizontal axis: lathe Y → world X, shifted to y = k. */
function axisTransform(spec: RevolutionSpec) {
  return spec.method === 'shell'
    ? { rotation: [0, 0, 0] as Vec3, position: [0, 0, 0] as Vec3, phiStart: Math.PI / 2 }
    : { rotation: [0, 0, -Math.PI / 2] as Vec3, position: [0, spec.k ?? 0, 0] as Vec3, phiStart: -Math.PI / 2 }
}

function sliceColor(i: number, n: number): THREE.Color {
  return new THREE.Color().setHSL(0.53 + 0.2 * (n <= 1 ? 0 : i / (n - 1)), 0.75, 0.56)
}

function slabGeometry(rIn: number, rOut: number, depth: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape().absarc(0, 0, Math.max(rOut, 1e-4), 0, Math.PI * 2, false)
  if (rIn > 1e-4) shape.holes.push(new THREE.Path().absarc(0, 0, rIn, 0, Math.PI * 2, true))
  return new THREE.ExtrudeGeometry(shape, { depth: Math.max(depth, 1e-4), bevelEnabled: false, curveSegments: 64 })
}

// ── 2D region in the xy-plane ───────────────────────────────────────────────

function Region({ spec }: { spec: RevolutionSpec }) {
  const outline = useMemo(() => regionOutline(spec, PROFILE_SAMPLES), [spec])
  const geometry = useMemo(() => {
    const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)))
    return new THREE.ShapeGeometry(shape)
  }, [outline])
  useEffect(() => () => geometry.dispose(), [geometry])

  const half = PROFILE_SAMPLES + 1
  const lower = outline.slice(0, half).map(([x, y]) => [x, y, 0] as Vec3)
  const upper = outline.slice(half).map(([x, y]) => [x, y, 0] as Vec3)

  return (
    <group>
      <mesh geometry={geometry} renderOrder={2}>
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.42} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Line points={upper} color="#fbbf24" lineWidth={3} />
      {spec.method === 'washer' && <Line points={lower} color="#fb923c" lineWidth={3} />}
    </group>
  )
}

// ── Swept solid (animated lathe) ────────────────────────────────────────────

function SweptSolid({ spec, timeline, slicesVisible }: { spec: RevolutionSpec; timeline: Timeline; slicesVisible: boolean }) {
  const mesh = useRef<THREE.Mesh>(null)
  const material = useRef<THREE.MeshPhysicalMaterial>(null)
  const edge = useRef<THREE.Group>(null)
  const lastPhi = useRef(-1)
  const profile = useMemo(
    () => latheProfile(spec, PROFILE_SAMPLES).map(([r, y]) => new THREE.Vector2(r, y)),
    [spec],
  )
  const { rotation, position, phiStart } = axisTransform(spec)
  const profilePoints = useMemo(() => profile.map(p => [p.x, p.y, 0] as Vec3), [profile])

  useEffect(() => {
    lastPhi.current = -1
  }, [profile])

  useEffect(() => () => mesh.current?.geometry.dispose(), [])

  useFrame(() => {
    if (material.current) {
      // Opaque while sweeping; turns to glass as the slices grow in so they stay visible.
      const fade = slicesVisible ? clamp01((timeline.current - SWEEP_SECONDS) / (SLICE_DELAY + SLICE_GROW)) : 0
      material.current.opacity = 0.62 - 0.5 * fade
    }
    const phi = sweepAngle(timeline.current)
    if (Math.abs(phi - lastPhi.current) < 1e-4 || !mesh.current) return
    lastPhi.current = phi
    mesh.current.geometry.dispose()
    mesh.current.geometry = new THREE.LatheGeometry(profile, RADIAL_SEGMENTS, phiStart, phi)
    if (edge.current) {
      edge.current.rotation.y = phiStart + phi - Math.PI / 2
      edge.current.visible = phi < Math.PI * 2 - 1e-3
    }
  })

  const meridians = useMemo(() => Array.from({ length: 12 }, (_, i) => phiStart + (i * Math.PI) / 6), [phiStart])
  const done = timeline.current >= SWEEP_SECONDS

  return (
    <group rotation={rotation} position={position}>
      <mesh ref={mesh} renderOrder={1}>
        <meshPhysicalMaterial
          ref={material}
          color="#38bdf8"
          transparent
          opacity={0.62}
          roughness={0.12}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <group ref={edge}>
        {/* lathe point at angle φ is (r sin φ, y, r cos φ): rotate the xy-profile by φ − π/2 */}
        <Line points={profilePoints} color="#ffffff" lineWidth={3} />
      </group>
      {done &&
        meridians.map(phi => (
          <group key={phi} rotation={[0, phi - Math.PI / 2, 0]}>
            <Line points={profilePoints} color="#7dd3fc" lineWidth={1} transparent opacity={0.28} />
          </group>
        ))}
    </group>
  )
}

// ── Riemann slices: disks, washers or shells ────────────────────────────────

function SliceSlab({ slice, method, k, color, index, timeline, highlight }: {
  slice: Slice; method: RevolutionMethod; k: number; color: THREE.Color; index: number; timeline: Timeline; highlight: boolean
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => {
    if (method === 'shell') {
      const w = slice.rOut - slice.rIn
      const gap = w * 0.08
      return slabGeometry(slice.rIn + gap / 2, slice.rOut - gap / 2, Math.abs(slice.height))
    }
    const gap = (slice.x1 - slice.x0) * 0.1
    return slabGeometry(slice.rIn, slice.rOut, slice.x1 - slice.x0 - gap)
  }, [slice, method])
  useEffect(() => () => geometry.dispose(), [geometry])

  const placement =
    method === 'shell'
      ? { position: [0, Math.min(0, slice.height), 0] as Vec3, rotation: [-Math.PI / 2, 0, 0] as Vec3 }
      : { position: [slice.x0 + (slice.x1 - slice.x0) * 0.05, k, 0] as Vec3, rotation: [0, Math.PI / 2, 0] as Vec3 }

  useFrame(() => {
    if (!mesh.current) return
    const start = SWEEP_SECONDS + SLICE_DELAY + index * SLICE_STAGGER
    const s = Math.max(0.0001, easeOutBack(clamp01((timeline.current - start) / SLICE_GROW)))
    mesh.current.scale.set(s, s, 1)
  })

  return (
    <mesh ref={mesh} geometry={geometry} position={placement.position} rotation={placement.rotation} scale={[0.0001, 0.0001, 1]}>
      <meshStandardMaterial
        color={highlight ? '#fbbf24' : color}
        emissive={highlight ? '#b45309' : '#000000'}
        emissiveIntensity={highlight ? 0.35 : 0}
        roughness={0.32}
        metalness={0.15}
      />
    </mesh>
  )
}

function Dimension({ from, to, label, unit, color, labelOffset }: { from: Vec3; to: Vec3; label: string; unit: number; color: string; labelOffset: Vec3 }) {
  const mid: Vec3 = [(from[0] + to[0]) / 2 + labelOffset[0], (from[1] + to[1]) / 2 + labelOffset[1], (from[2] + to[2]) / 2 + labelOffset[2]]
  return (
    <group>
      <Line points={[from, to]} color={color} lineWidth={2.5} depthTest={false} renderOrder={20} />
      {[from, to].map((p, i) => (
        <mesh key={i} position={p} renderOrder={20}>
          <sphereGeometry args={[unit * 0.014, 12, 12]} />
          <meshBasicMaterial color={color} depthTest={false} />
        </mesh>
      ))}
      <Label position={mid} size={unit * 0.065} color={color} overlay>
        {label}
      </Label>
    </group>
  )
}

function SliceAnnotations({ slice, method, k, unit }: { slice: Slice; method: RevolutionMethod; k: number; unit: number }) {
  const lift = unit * 0.06
  if (method === 'shell') {
    const h = slice.height
    const top = Math.max(0, h)
    return (
      <group>
        <Dimension from={[0, top + lift, 0]} to={[slice.xm, top + lift, 0]} label="x" unit={unit} color="#f8fafc" labelOffset={[0, lift, 0]} />
        <Dimension from={[slice.rOut + lift * 0.5, 0, 0]} to={[slice.rOut + lift * 0.5, h, 0]} label="f(x)" unit={unit} color="#fbbf24" labelOffset={[lift * 2.2, 0, 0]} />
        <Dimension from={[slice.rIn, top + lift * 2.6, 0]} to={[slice.rOut, top + lift * 2.6, 0]} label="Δx" unit={unit} color="#a5b4fc" labelOffset={[0, lift, 0]} />
      </group>
    )
  }
  const xm = slice.xm
  return (
    <group>
      <Dimension from={[xm, k, 0]} to={[xm, k + slice.rOut, 0]} label="R(x)" unit={unit} color="#f8fafc" labelOffset={[lift * 2.4, 0, 0]} />
      {method === 'washer' && slice.rIn > 1e-3 && (
        <Dimension from={[xm, k, 0]} to={[xm, k - slice.rIn, 0]} label="r(x)" unit={unit} color="#fb923c" labelOffset={[lift * 2.2, 0, 0]} />
      )}
      <Dimension
        from={[slice.x0, k + slice.rOut + lift, 0]}
        to={[slice.x1, k + slice.rOut + lift, 0]}
        label="Δx"
        unit={unit}
        color="#a5b4fc"
        labelOffset={[0, lift * 1.1, 0]}
      />
    </group>
  )
}

function Slices({ spec, n, timeline, unit, annotate }: { spec: RevolutionSpec; n: number; timeline: Timeline; unit: number; annotate: boolean }) {
  const list = useMemo(() => slices(spec, n), [spec, n])
  const hi = Math.floor(list.length / 2)
  return (
    <group>
      {list.map((s, i) => (
        <SliceSlab
          key={`${i}-${list.length}`}
          slice={s}
          method={spec.method}
          k={spec.k ?? 0}
          color={sliceColor(i, list.length)}
          index={i}
          timeline={timeline}
          highlight={i === hi}
        />
      ))}
      {annotate && list[hi] && <SliceAnnotations slice={list[hi]} method={spec.method} k={spec.k ?? 0} unit={unit} />}
    </group>
  )
}

/** x-ticks for solids built around the x-axis, where the axis itself is buried inside the solid. */
function Ruler({ ticks, y, a, b, unit }: { ticks: number[]; y: number; a: number; b: number; unit: number }) {
  const tick = unit * 0.025
  return (
    <group>
      <Line points={[[a, y, 0], [b, y, 0]]} color="#475569" lineWidth={1.2} />
      {ticks.map(t => (
        <group key={t}>
          <Line points={[[t, y, 0], [t, y - tick, 0]]} color="#64748b" lineWidth={1.2} />
          <Label position={[t, y - tick - unit * 0.04, 0]} size={unit * 0.05} color="#94a3b8">
            {Number.isInteger(t) ? t : t.toFixed(1)}
          </Label>
        </group>
      ))}
    </group>
  )
}

function ShiftedAxis({ k, from, to, unit }: { k: number; from: number; to: number; unit: number }) {
  return (
    <group>
      <Line
        points={[[from, k, 0], [to, k, 0]]}
        color="#fbbf24"
        lineWidth={2}
        dashed
        dashSize={unit * 0.04}
        gapSize={unit * 0.025}
        depthTest={false}
        renderOrder={19}
      />
      <Label position={[to + unit * 0.02, k, 0]} size={unit * 0.055} color="#fbbf24" anchorX="left" overlay>
        {`y = ${k}`}
      </Label>
    </group>
  )
}

// ── Timeline driver ─────────────────────────────────────────────────────────

function Clock({ timeline, end, onDone }: { timeline: Timeline; end: number; onDone: () => void }) {
  const fired = useRef(false)
  useFrame((_, dt) => {
    if (timeline.current >= end) {
      if (!fired.current) {
        fired.current = true
        onDone()
      }
      return
    }
    fired.current = false
    timeline.current = Math.min(end, timeline.current + Math.min(dt, 1 / 8))
  })
  return null
}

// ── Scene ───────────────────────────────────────────────────────────────────

export interface VolumesRevolutionSceneProps {
  method: RevolutionMethod
  fn: string
  innerFn?: string
  a: number
  b: number
  n: number
  k?: number
  cameraPreset?: CameraPreset
}

function toFn(expr: string | undefined): ((x: number) => number) | null {
  if (expr === undefined) return null
  const parsed = parseExpression(expr, ['x'])
  return parsed.valid && parsed.fn ? (x: number) => parsed.fn!({ x }) : null
}

export function VolumesRevolutionScene({ method, fn, innerFn, a, b, n, k = 0, cameraPreset = '3d' }: VolumesRevolutionSceneProps) {
  const f = useMemo(() => toFn(fn), [fn])
  const g = useMemo(() => toFn(innerFn), [innerFn])
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)

  const spec = useMemo<RevolutionSpec | null>(
    () => (f ? { method, f, g: g ?? undefined, a: lo, b: hi, k: method === 'shell' ? 0 : k } : null),
    [method, f, g, lo, hi, k],
  )

  const [showSolid, setShowSolid] = useState(true)
  const [showSlices, setShowSlices] = useState(true)
  const [done, setDone] = useState(false)
  const [replay, setReplay] = useState(0)
  const timeline = useRef(0)

  useEffect(() => {
    timeline.current = 0
    setDone(false)
  }, [method, fn, innerFn, replay])

  const layout = useMemo(() => {
    if (!spec) return null
    const sb = solidBounds(spec)
    const unit = Math.max(sb.max[0] - sb.min[0], sb.max[1] - sb.min[1], sb.max[2] - sb.min[2], 0.5)
    const pad = unit * 0.12
    const axes = {
      x: [Math.min(sb.min[0], 0) - pad, sb.max[0] + pad * 2] as [number, number],
      y: [Math.min(sb.min[1], 0) - pad * 0.5, Math.max(sb.max[1], 0) + pad * 2] as [number, number],
      z: [sb.min[2] - pad * 0.5, sb.max[2] + pad * 2] as [number, number],
    }
    const bounds = {
      min: [axes.x[0], Math.min(axes.y[0], sb.min[1] - pad), axes.z[0]] as Vec3,
      max: [axes.x[1], axes.y[1], axes.z[1]] as Vec3,
    }
    return {
      unit, axes, bounds, solidMinY: sb.min[1],
      xTicks: integerTicks(sb.min[0], sb.max[0]),
    }
  }, [spec])

  if (!spec || !layout) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#060912] text-sm text-red-300">
        Can&apos;t plot f(x) = {fn}. Check the expression.
      </div>
    )
  }

  const direction3d: Vec3 = method === 'shell' ? [1.3, 0.9, 1.6] : [0.75, 0.6, 1.5]

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg">
      <Stage bounds={layout.bounds} preset={cameraPreset} direction3d={direction3d}>
        <Clock timeline={timeline} end={totalDuration(n)} onDone={() => setDone(true)} />
        <Axes3D
          x={layout.axes.x}
          y={layout.axes.y}
          z={layout.axes.z}
          unit={layout.unit}
          xTicks={method === 'shell' ? layout.xTicks : undefined}
        />
        {method !== 'shell' && k !== 0 && <ShiftedAxis k={k} from={layout.axes.x[0]} to={layout.axes.x[1]} unit={layout.unit} />}
        {method !== 'shell' && (
          <Ruler ticks={layout.xTicks} y={layout.solidMinY - layout.unit * 0.05} a={spec.a} b={spec.b} unit={layout.unit} />
        )}
        <Region spec={spec} />
        {showSolid && <SweptSolid spec={spec} timeline={timeline} slicesVisible={showSlices} />}
        {showSlices && <Slices spec={spec} n={n} timeline={timeline} unit={layout.unit} annotate={done} />}
      </Stage>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <div className="pointer-events-auto flex gap-1 rounded-lg bg-black/50 p-1 text-xs backdrop-blur">
          <button
            onClick={() => setReplay(r => r + 1)}
            className="rounded px-2.5 py-1 font-medium text-gray-200 transition hover:bg-white/10"
          >
            ↻ Revolve
          </button>
          <Toggle on={showSolid} onClick={() => setShowSolid(v => !v)} label="Solid" />
          <Toggle on={showSlices} onClick={() => setShowSlices(v => !v)} label={method === 'shell' ? 'Shells' : method === 'washer' ? 'Washers' : 'Disks'} />
        </div>
        <p className="rounded-lg bg-black/50 px-2.5 py-1 text-xs text-gray-300 backdrop-blur">
          {method === 'shell' ? 'Revolving about the y-axis' : k === 0 ? 'Revolving about the x-axis' : `Revolving about y = ${k}`}
        </p>
      </div>
    </div>
  )
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded px-2.5 py-1 font-medium transition ${on ? 'bg-sky-500/25 text-sky-200' : 'text-gray-400 hover:bg-white/10'}`}
    >
      {label}
    </button>
  )
}
