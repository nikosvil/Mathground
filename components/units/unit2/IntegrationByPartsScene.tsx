'use client'

import { useMemo, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

type IBPParadigm = 'geometric' | 'tabular'

export interface IntegrationByPartsSceneProps {
  paradigm: IBPParadigm
  a: number
  b: number
  steps?: number
}

// ── helpers ────────────────────────────────────────────────────────────────

function factorial(n: number): number {
  return n <= 0 ? 1 : n * factorial(n - 1)
}

function termStr(n: number, k: number): string {
  const power = n - k
  const coef = factorial(n) / factorial(n - k)
  if (power === 0) return `${coef}`
  if (power === 1) return coef === 1 ? 'x' : `${coef}x`
  return coef === 1 ? `x^${power}` : `${coef}x^${power}`
}

// ── Tabular view (plain React, no Canvas needed) ──────────────────────────

function TabularView({ steps }: { steps: number }) {
  const n = Math.max(1, Math.min(5, Math.round(steps)))
  // n+1 non-terminal rows + 1 terminal '0' row
  const rows = Array.from({ length: n + 2 }, (_, k) => ({
    sign: k % 2 === 0 ? '+' : '−',
    d: k <= n ? termStr(n, k) : '0',
    terminal: k === n + 1,
  }))

  return (
    <div className="flex h-full items-center justify-center">
      <div
        style={{
          background: '#1f2937',
          borderRadius: 10,
          padding: '16px 24px',
          border: '1px solid #374151',
        }}
      >
        <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 10 }}>
          Tabular IBP: ∫ x<sup>{n}</sup> e<sup>x</sup> dx
        </div>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, color: '#e5e7eb' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151' }}>
              <th style={{ padding: '4px 12px', color: '#6b7280', fontWeight: 500 }}>Sign</th>
              <th style={{ padding: '4px 12px', color: '#60a5fa', fontWeight: 500 }}>D</th>
              <th style={{ padding: '4px 12px', color: '#f59e0b', fontWeight: 500 }}>I (eˣ)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ opacity: row.terminal ? 0.4 : 1 }}>
                <td
                  style={{
                    textAlign: 'center',
                    padding: '4px 12px',
                    color: row.sign === '+' ? '#86efac' : '#fca5a5',
                    fontWeight: 700,
                  }}
                >
                  {row.terminal ? '' : row.sign}
                </td>
                <td style={{ padding: '4px 12px', fontFamily: 'monospace' }}>{row.d}</td>
                <td style={{ padding: '4px 12px', fontFamily: 'monospace' }}>eˣ</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            color: '#6b7280',
            fontSize: 11,
            marginTop: 8,
            borderTop: '1px solid #374151',
            paddingTop: 8,
          }}
        >
          Multiply diagonals: sign × D[k] × I[k+1]
        </div>
      </div>
    </div>
  )
}

// ── Geometric scene internals ─────────────────────────────────────────────

const N = 80

function SceneCamera({ a, b }: { a: number; b: number }) {
  const { camera } = useThree()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    const vb = Math.exp(b)
    const camX = b / 2
    const camY = vb / 2
    const camZ = Math.max(b, vb) * 1.5 + 5
    camera.position.set(camX, camY, camZ)
    camera.lookAt(camX, camY, 0)
    if (controlsRef.current) {
      controlsRef.current.target.set(camX, camY, 0)
      controlsRef.current.update()
    }
  }, [a, b, camera])

  return <OrbitControls ref={controlsRef} enableRotate={false} />
}

function GeometricContent({ a, b }: { a: number; b: number }) {
  const va = Math.exp(a)
  const vb = Math.exp(b)
  const vDu = vb - va                   // ∫v du = eᵇ − eᵃ
  const uv = b * vb - a * va            // [uv]ₐᵇ = b·eᵇ − a·eᵃ
  const uDv = uv - vDu                  // ∫u dv (what we want to compute)

  // Curve v = eᵘ from u=a to u=b
  const curvePoints = useMemo((): [number, number, number][] => {
    return Array.from({ length: N + 1 }, (_, i) => {
      const u = a + (i / N) * (b - a)
      return [u, Math.exp(u), 0.01]
    })
  }, [a, b])

  // Orange region: ∫v du — under the curve from u-axis to v=eᵘ
  const orangeGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(a, 0)
    shape.lineTo(a, va)
    for (let i = 1; i <= N; i++) {
      const u = a + (i / N) * (b - a)
      shape.lineTo(u, Math.exp(u))
    }
    shape.lineTo(b, 0)
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  }, [a, b, va])

  // Blue region: ∫u dv — left of curve between v=va and v=vb
  const blueGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, va)
    shape.lineTo(a, va)
    for (let i = 0; i <= N; i++) {
      const u = a + (i / N) * (b - a)
      shape.lineTo(u, Math.exp(u))
    }
    shape.lineTo(0, vb)
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  }, [a, b, va, vb])

  useEffect(() => () => { orangeGeo.dispose(); blueGeo.dispose() }, [orangeGeo, blueGeo])

  const midU = (a + b) / 2

  return (
    <>
      {/* Orange region */}
      <mesh geometry={orangeGeo} renderOrder={0}>
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Blue region */}
      <mesh geometry={blueGeo} renderOrder={0}>
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Curve v = eᵘ */}
      <Line points={curvePoints} color="#ffffff" lineWidth={2.5} />
      {/* Dashed rectangle hint */}
      <Line
        points={[
          [a, va, 0], [b, va, 0], [b, vb, 0], [0, vb, 0],
          [0, va, 0], [a, va, 0],
        ]}
        color="#6b7280"
        lineWidth={1}
        dashed
        dashSize={0.15}
        gapSize={0.1}
      />
      {/* Axes */}
      <Line points={[[-0.3, 0, 0], [b + 0.5, 0, 0]]} color="#4b5563" lineWidth={1} />
      <Line points={[[0, -0.3, 0], [0, vb + 0.5, 0]]} color="#4b5563" lineWidth={1} />
      {/* Orange label */}
      <Html position={[midU, va * 0.35, 0]}>
        <div
          style={{
            color: '#fbbf24',
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            textShadow: '0 1px 3px #000',
          }}
        >
          ∫v du = {vDu.toFixed(3)}
        </div>
      </Html>
      {/* Blue label */}
      <Html position={[a * 0.3, (va + vb) * 0.6, 0]}>
        <div
          style={{
            color: '#60a5fa',
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            textShadow: '0 1px 3px #000',
          }}
        >
          ∫u dv = {uDv.toFixed(3)}
        </div>
      </Html>
      {/* [uv] corner label */}
      <Html position={[b + 0.1, vb + 0.15, 0]}>
        <div
          style={{
            color: '#d1d5db',
            fontSize: 11,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          [uv] = {uv.toFixed(3)}
        </div>
      </Html>
    </>
  )
}

// ── Public component ──────────────────────────────────────────────────────

export function IntegrationByPartsScene({ paradigm, a, b, steps = 3 }: IntegrationByPartsSceneProps) {
  if (paradigm === 'tabular') {
    return <TabularView steps={steps} />
  }

  return (
    <Canvas
      data-testid="canvas"
      camera={{ position: [1, 4, 10], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneCamera a={a} b={b} />
      <GeometricContent a={a} b={b} />
    </Canvas>
  )
}
