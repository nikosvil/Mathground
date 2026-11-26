'use client'

interface VolumeFormulaDisplayProps {
  paradigm: 'disk' | 'washer' | 'shell'
  volume: number
  fn: string
  a: number
  b: number
  innerFn?: string
}

const FORMULAS: Record<string, (fn: string, innerFn?: string) => string> = {
  disk: (fn) => `V = π ∫ [${fn}]² dx`,
  washer: (fn, inner) => `V = π ∫ ([${fn}]² − [${inner ?? 'g(x)'}]²) dx`,
  shell: (fn) => `V = 2π ∫ x · ${fn} dx`,
}

export function VolumeFormulaDisplay({ paradigm, volume, fn, a, b, innerFn }: VolumeFormulaDisplayProps) {
  const formula = FORMULAS[paradigm]?.(fn, innerFn) ?? ''
  const volumeStr = `V ≈ ${volume.toFixed(4)}`
  const piApprox = volume / Math.PI
  const piStr = `≈ ${piApprox.toFixed(3)} π`

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
      <p className="text-xs uppercase tracking-wider text-gray-500">Volume</p>
      <p className="mt-1 font-mono text-sm text-gray-300">{formula}</p>
      <p className="text-xs text-gray-500">
        from x = {a} to x = {b}
      </p>
      <p className="mt-2 text-lg font-bold text-white">
        {volumeStr} {piStr}
      </p>
    </div>
  )
}
