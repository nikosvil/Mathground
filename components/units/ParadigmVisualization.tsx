'use client'

import { useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { Paradigm } from '@/lib/types'
import { VolumeFormulaDisplay } from './unit1/VolumeFormulaDisplay'
import { diskVolumeNumerical } from '@/lib/math/geometry/revolution'
import { parseExpression } from '@/lib/math/parser'

const VolumesRevolutionScene = dynamic(() => import('./unit1/VolumesRevolutionScene').then(m => ({ default: m.VolumesRevolutionScene })), { ssr: false })
const AreasBetweenCurvesScene = dynamic(() => import('./unit1/AreasBetweenCurvesScene').then(m => ({ default: m.AreasBetweenCurvesScene })), { ssr: false })
const FunctionPlot2D = dynamic(() => import('./unit2/FunctionPlot2D').then(m => ({ default: m.FunctionPlot2D })), { ssr: false })
const IntegrationByPartsScene = dynamic(() => import('./unit2/IntegrationByPartsScene').then(m => ({ default: m.IntegrationByPartsScene })), { ssr: false })
const TrigSubstitutionScene = dynamic(() => import('./unit2/TrigSubstitutionScene').then(m => ({ default: m.TrigSubstitutionScene })), { ssr: false })
const PartialFractionsScene = dynamic(() => import('./unit2/PartialFractionsScene').then(m => ({ default: m.PartialFractionsScene })), { ssr: false })
const NumericalIntegrationScene = dynamic(() => import('./unit2/NumericalIntegrationScene').then(m => ({ default: m.NumericalIntegrationScene })), { ssr: false })
const TaylorSeriesScene = dynamic(() => import('./unit3/TaylorSeriesScene').then(m => ({ default: m.TaylorSeriesScene })), { ssr: false })
const PartialSumsScene = dynamic(() => import('./unit3/PartialSumsScene').then(m => ({ default: m.PartialSumsScene })), { ssr: false })
const SequenceScene = dynamic(() => import('./unit3/SequenceScene').then(m => ({ default: m.SequenceScene })), { ssr: false })
const FourierSeriesScene = dynamic(() => import('./unit3/FourierSeriesScene').then(m => ({ default: m.FourierSeriesScene })), { ssr: false })
const ParametricCurveScene = dynamic(() => import('./unit4/ParametricCurveScene').then(m => ({ default: m.ParametricCurveScene })), { ssr: false })
const PolarCurveScene = dynamic(() => import('./unit4/PolarCurveScene').then(m => ({ default: m.PolarCurveScene })), { ssr: false })

function PartialSumsWrapper({ fn, numTerms, label }: { fn: string; numTerms: number; label: string }) {
  const parsedTerm = useMemo(() => parseExpression(fn, ['n']), [fn])
  const termFn = useCallback((n: number) => {
    if (!parsedTerm.valid || !parsedTerm.fn) return 0
    return parsedTerm.fn({ n }) as number
  }, [parsedTerm])
  return <PartialSumsScene termFn={termFn} numTerms={numTerms} label={label} />
}

interface ParadigmVisualizationProps {
  courseId: string
  unitId: string
  topicId: string
  paradigm: Paradigm
  sliderValues: Record<string, number>
  cameraPreset: '3d' | 'side' | 'top'
}

export function ParadigmVisualization({
  paradigm,
  sliderValues,
  cameraPreset,
}: ParadigmVisualizationProps) {
  const vc = paradigm.visualizationComponent
  const sv = sliderValues

  // ── Unit 1: Volumes of revolution ──────────────────────────────────────────
  if (vc === 'VolumesRevolution') {
    const revType =
      paradigm.id.includes('disk') || paradigm.id === 'custom' ? 'disk'
      : paradigm.id.includes('washer') || paradigm.id === 'shifted-axis' ? 'washer'
      : paradigm.id.includes('shell') || paradigm.id === 'comparison' ? 'shell'
      : 'disk'

    const fn = paradigm.inputs.type === 'single' ? (paradigm.inputs.fn ?? 'x^2') : 'x^2'
    const innerFn = paradigm.inputs.type === 'single' ? paradigm.inputs.fn2 : undefined
    const a = sv.a ?? 0
    const b = sv.b ?? 1

    let volume = 0
    const outerParsed = parseExpression(fn, ['x'])
    if (outerParsed.valid && outerParsed.fn) {
      volume = diskVolumeNumerical(outerParsed.fn, a, b, 500).volume
    }

    return (
      <div className="flex h-full flex-col gap-2 p-2">
        <div className="flex-1">
          <VolumesRevolutionScene paradigm={revType} sliderValues={sv} fn={fn} innerFn={innerFn} cameraPreset={cameraPreset} />
        </div>
        <div className="shrink-0">
          <VolumeFormulaDisplay paradigm={revType} volume={volume} fn={fn} a={a} b={b} innerFn={innerFn} />
        </div>
      </div>
    )
  }

  // ── Unit 1: Areas between curves ───────────────────────────────────────────
  if (vc === 'AreasBetweenCurves') {
    const fnDefaults: Record<string, { fnTop: string; fnBottom: string }> = {
      standard:   { fnTop: '1',       fnBottom: 'x^2' },
      crossed:    { fnTop: 'cos(x)',  fnBottom: 'x/3 - 0.3' },
      horizontal: { fnTop: 'sqrt(x)', fnBottom: 'x/2' },
    }
    const d = fnDefaults[paradigm.id] ?? fnDefaults.standard
    return (
      <div className="h-full w-full">
        <AreasBetweenCurvesScene fnTop={d.fnTop} fnBottom={d.fnBottom} a={sv.a ?? -1} b={sv.b ?? 1} />
      </div>
    )
  }

  // ── Unit 1/2: Generic function plot (ArcLength, etc.) ──────────────────────
  if (['ArcLength', 'SurfaceRevolution', 'CentersOfMass', 'Work', 'FluidPressure'].includes(vc)) {
    const fn = paradigm.inputs.type === 'single' ? (paradigm.inputs.fn ?? 'sin(x)') : 'sin(x)'
    return (
      <div className="h-full w-full">
        <FunctionPlot2D fn={fn} xMin={sv.a ?? -3} xMax={sv.b ?? 3} label={paradigm.title} />
      </div>
    )
  }

  // ── Unit 2: Integration by Parts — dedicated geometric/tabular scene ───────
  if (vc === 'IntegrationByParts') {
    return (
      <div className="h-full w-full">
        <IntegrationByPartsScene
          paradigm={paradigm.id as 'geometric' | 'tabular'}
          a={sv.a ?? 0}
          b={sv.b ?? 2}
          steps={Math.round(sv.steps ?? 3)}
        />
      </div>
    )
  }

  // ── Unit 2: Trig substitution — dedicated 3D geometric scene ──────────────
  if (vc === 'TrigSubstitution') {
    return (
      <div className="h-full w-full">
        <TrigSubstitutionScene
          paradigm={paradigm.id as 'a2-x2' | 'a2+x2' | 'x2-a2'}
          a={sv.a ?? 2}
          x={sv.x ?? 0.5}
        />
      </div>
    )
  }

  // ── Unit 2: Partial fractions — 3D decomposition scene ────────────────────
  if (vc === 'PartialFractions') {
    return (
      <div className="h-full w-full">
        <PartialFractionsScene
          paradigm={paradigm.id as 'distinct-roots' | 'repeated-root' | 'irreducible-quadratic'}
          a={sv.a ?? -2}
          b={sv.b ?? 3}
          c={sv.c ?? 1}
        />
      </div>
    )
  }

  // ── Unit 2: Integration techniques — 2D function plots ─────────────────────
  if (['TrigIntegrals', 'ImproperIntegrals'].includes(vc)) {
    const fnMap: Record<string, (sv: Record<string, number>) => string> = {
      TrigIntegrals:     (sv) => paradigm.id === 'tan-sec'
                                   ? `tan(x)^${sv.m ?? 2} * sec(x)^2`
                                   : `sin(x)^${sv.m ?? 2} * cos(x)^${sv.n ?? 3}`,
      ImproperIntegrals: (sv) => `1 / x^${sv.p ?? 2}`,
    }
    const getFn = fnMap[vc]
    const fn = getFn ? getFn(sv) : 'sin(x)'
    return (
      <div className="h-full w-full">
        <FunctionPlot2D fn={fn} xMin={sv.a ?? -3} xMax={sv.b ?? 3} label={paradigm.title} />
      </div>
    )
  }

  // ── Unit 2: Numerical integration — Riemann sums ───────────────────────────
  if (vc === 'NumericalIntegration') {
    const method = paradigm.id === 'riemann' ? 'left' : 'midpoint'
    return (
      <div className="h-full w-full">
        <NumericalIntegrationScene
          fn="sin(x)"
          a={sv.a ?? 0}
          b={sv.b ?? Math.PI}
          n={Math.max(1, Math.round(sv.n ?? 8))}
          method={method}
        />
      </div>
    )
  }

  // ── Unit 3: Sequences scatter plot ─────────────────────────────────────────
  if (vc === 'Sequences') {
    const fnMap: Record<string, string> = {
      convergent:  '1/n',
      oscillating: '(-1)^n / n',
      divergent:   'n / 10',
      bounded:     'sin(n)',
    }
    return (
      <div className="h-full w-full">
        <SequenceScene termFn={fnMap[paradigm.id] ?? '1/n'} N={Math.max(1, Math.round(sv.N ?? 30))} />
      </div>
    )
  }

  // ── Unit 3: Series partial sums ────────────────────────────────────────────
  if (['SeriesPartialSums', 'ConvergenceTests', 'AlternatingSeries'].includes(vc)) {
    const fnMap: Record<string, (sv: Record<string, number>) => string> = {
      geometric:        (sv) => `${sv.r ?? 0.5}^n`,
      harmonic:         () => '1/n',
      telescoping:      () => '1/(n*(n+1))',
      'integral-test':  (sv) => `1/n^${sv.p ?? 2}`,
      'comparison-test': () => '1/n^2',
      'ratio-test':     () => '0.9^n',
      'root-test':      () => '0.9^n',
      zigzag:           () => '(-1)^n / n',
      'error-bound':    () => '(-1)^n / n',
    }
    const getFn = fnMap[paradigm.id]
    const fn = getFn ? getFn(sv) : '1/n^2'
    return (
      <div className="h-full w-full">
        <PartialSumsWrapper fn={fn} numTerms={Math.max(1, Math.round(sv.N ?? 20))} label={paradigm.title} />
      </div>
    )
  }

  // ── Unit 3: Fourier series ─────────────────────────────────────────────────
  if (vc === 'FourierSeries') {
    const waveType = paradigm.id === 'sawtooth' ? 'sawtooth' : 'square-wave'
    return (
      <div className="h-full w-full">
        <FourierSeriesScene waveType={waveType} N={Math.max(1, Math.round(sv.N ?? 5))} />
      </div>
    )
  }

  // ── Unit 3: Taylor / Power series ─────────────────────────────────────────
  if (['TaylorSeries', 'PowerSeries'].includes(vc)) {
    const fnMap: Record<string, string> = {
      sin:                     'sin(x)',
      exp:                     'exp(x)',
      cos:                     'cos(x)',
      ln:                      'ln(1 + x)',
      custom:                  'sin(x)',
      'geometric-power':       '1/(1-x)',
      'radius-of-convergence': '1/(1-x)',
    }
    return (
      <div className="h-full w-full">
        <TaylorSeriesScene
          fn={fnMap[paradigm.id] ?? 'sin(x)'}
          x0={sv.x0 ?? 0}
          degree={Math.max(0, Math.round(sv.N ?? 5))}
          xMin={-4}
          xMax={4}
        />
      </div>
    )
  }

  // ── Unit 4: Parametric curves ──────────────────────────────────────────────
  if (vc === 'ParametricCurves') {
    let xFn = paradigm.inputs.type === 'parametric' ? (paradigm.inputs.xFn ?? 'cos(t)') : 'cos(t)'
    let yFn = paradigm.inputs.type === 'parametric' ? (paradigm.inputs.yFn ?? 'sin(t)') : 'sin(t)'
    const tMin = sv.tMin ?? 0
    const tMax = sv.tMax ?? sv.T ?? 6.28

    if (paradigm.id === 'cycloid') {
      xFn = 't - sin(t)'; yFn = '1 - cos(t)'
    } else if (paradigm.id === 'circle') {
      const r = sv.r ?? 1
      xFn = `${r} * cos(t)`; yFn = `${r} * sin(t)`
    } else if (paradigm.id === 'lissajous') {
      const a = sv.a ?? 2, b = sv.b ?? 3
      xFn = `sin(${a} * t)`; yFn = `sin(${b} * t)`
    }

    return (
      <div className="h-full w-full">
        <ParametricCurveScene xFn={xFn} yFn={yFn} tMin={tMin} tMax={tMax} />
      </div>
    )
  }

  // ── Unit 4: Polar curves ───────────────────────────────────────────────────
  if (['PolarCurves', 'PolarAreaArcLength'].includes(vc)) {
    let rFn = paradigm.inputs.type === 'single' ? (paradigm.inputs.fn ?? '1 + cos(θ)') : '1 + cos(θ)'
    const thetaMax = sv.Theta ?? 6.28

    if (paradigm.id === 'cardioid')           rFn = '1 + cos(θ)'
    else if (paradigm.id === 'rose')          rFn = `cos(${sv.n ?? 3} * θ)`
    else if (paradigm.id === 'spiral')        rFn = `${sv.a ?? 0.3} * θ`
    else if (paradigm.id === 'limacon')       rFn = `${sv.a ?? 1} + ${sv.b ?? 1} * cos(θ)`
    else if (paradigm.id === 'area-sweep')    rFn = '1 + cos(θ)'
    else if (paradigm.id === 'arc-length')    rFn = '1 + cos(θ)'

    return (
      <div className="h-full w-full">
        <PolarCurveScene rFn={rFn} thetaMin={0} thetaMax={thetaMax} />
      </div>
    )
  }

  // ── Unit 4: Conic sections as parametric ───────────────────────────────────
  if (vc === 'ConicSections') {
    const a = sv.a ?? 3, b = sv.b ?? 2
    let xFn = `${a} * cos(t)`, yFn = `${b} * sin(t)`
    let tMin = 0, tMax = 6.28

    if (paradigm.id === 'parabola') {
      const p = sv.p ?? 1
      xFn = 't'; yFn = `t^2 / (4 * ${p})`
      tMin = -4; tMax = 4
    } else if (paradigm.id === 'hyperbola') {
      xFn = `${a} / cos(t)`; yFn = `${b} * tan(t)`
      tMin = -1.4; tMax = 1.4
    } else if (paradigm.id === 'rotation') {
      const angle = sv.angle ?? 0.5
      xFn = `${a} * cos(t) * cos(${angle}) - ${b} * sin(t) * sin(${angle})`
      yFn = `${a} * cos(t) * sin(${angle}) + ${b} * sin(t) * cos(${angle})`
    }

    return (
      <div className="h-full w-full">
        <ParametricCurveScene xFn={xFn} yFn={yFn} tMin={tMin} tMax={tMax} />
      </div>
    )
  }

  // ── Unit 4: Conics in polar form ───────────────────────────────────────────
  if (vc === 'ConicsInPolar') {
    const e = sv.e ?? 0.5, d = sv.d ?? 2
    const rFn = `${(e * d).toFixed(4)} / (1 + ${e} * cos(θ))`
    return (
      <div className="h-full w-full">
        <PolarCurveScene rFn={rFn} thetaMin={0} thetaMax={6.28} />
      </div>
    )
  }

  // ── Fallback ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full items-center justify-center text-gray-500">
      <p>Visualization coming soon for <strong className="text-gray-300">{paradigm.title}</strong></p>
    </div>
  )
}
