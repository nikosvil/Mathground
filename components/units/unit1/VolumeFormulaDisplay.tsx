'use client'

import { useMemo } from 'react'
import katex from 'katex'
import { parse } from 'mathjs'
import type { RevolutionMethod } from '@/lib/math/volumes'

function exprTex(expr: string | undefined): string {
  if (!expr) return '\\text{?}'
  try {
    return parse(expr).toTex()
  } catch {
    return '\\text{?}'
  }
}

function num(v: number): string {
  return String(Number(v.toFixed(2)))
}

function shifted(tex: string, k: number): string {
  if (k === 0) return tex
  return `\\left(${tex}${k < 0 ? '+' : '-'}${num(Math.abs(k))}\\right)`
}

export function volumeTex(method: RevolutionMethod, fn: string, innerFn: string | undefined, k: number, a: number, b: number): string {
  const lim = `\\int_{${num(a)}}^{${num(b)}}`
  const F = exprTex(fn)
  if (method === 'shell') return `V = 2\\pi ${lim} x\\,\\left[${F}\\right]\\,dx`
  if (method === 'washer') {
    return `V = \\pi ${lim} \\left(\\left[${F}\\right]^{2} - \\left[${exprTex(innerFn)}\\right]^{2}\\right)dx`
  }
  return `V = \\pi ${lim} \\left[${shifted(F, k)}\\right]^{2}\\,dx`
}

const SLICE_NAME: Record<RevolutionMethod, string> = { disk: 'disks', washer: 'washers', shell: 'shells' }
const METHOD_NAME: Record<RevolutionMethod, string> = { disk: 'Disk method', washer: 'Washer method', shell: 'Shell method' }

interface VolumeFormulaDisplayProps {
  method: RevolutionMethod
  fn: string
  innerFn?: string
  a: number
  b: number
  k: number
  n: number
  riemann: number
  exact: number
}

export function VolumeFormulaDisplay({ method, fn, innerFn, a, b, k, n, riemann, exact }: VolumeFormulaDisplayProps) {
  const html = useMemo(
    () => katex.renderToString(volumeTex(method, fn, innerFn, k, a, b), { displayMode: true, throwOnError: false }),
    [method, fn, innerFn, k, a, b],
  )
  const valid = Number.isFinite(riemann) && Number.isFinite(exact)
  const errorPct = valid && exact !== 0 ? (Math.abs(riemann - exact) / Math.abs(exact)) * 100 : null

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 rounded-lg border border-gray-800 bg-gray-950/80 py-3 pl-5 pr-24">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-gray-500">Volume · {METHOD_NAME[method]}</p>
        <div className="overflow-x-auto text-gray-100 [&_.katex-display]:my-1" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      {valid && (
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-sky-300/80">Riemann sum · {n} {SLICE_NAME[method]}</p>
            <p className="font-mono text-lg text-sky-200">{(riemann / Math.PI).toFixed(3)}π</p>
            {errorPct !== null && <p className="text-xs text-gray-500">{errorPct.toFixed(2)}% off</p>}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-amber-300/80">Exact integral</p>
            <p className="font-mono text-lg font-semibold text-amber-200">{(exact / Math.PI).toFixed(3)}π</p>
            <p className="text-xs text-gray-500">≈ {exact.toFixed(4)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
