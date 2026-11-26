'use client'

import type { Paradigm } from '@/lib/types'
import { VolumesRevolutionScene } from './unit1/VolumesRevolutionScene'
import { VolumeFormulaDisplay } from './unit1/VolumeFormulaDisplay'
import { FunctionPlot2D } from './unit2/FunctionPlot2D'
import { TaylorSeriesScene } from './unit3/TaylorSeriesScene'
import { PartialSumsScene } from './unit3/PartialSumsScene'
import { ParametricCurveScene } from './unit4/ParametricCurveScene'
import { PolarCurveScene } from './unit4/PolarCurveScene'
import { diskVolumeNumerical } from '@/lib/math/geometry/revolution'
import { parseExpression } from '@/lib/math/parser'

interface ParadigmVisualizationProps {
  courseId: string
  unitId: string
  topicId: string
  paradigm: Paradigm
  sliderValues: Record<string, number>
  cameraPreset: '3d' | 'side' | 'top'
}

function getRevolutionParadigm(paradigmId: string): 'disk' | 'washer' | 'shell' | null {
  if (paradigmId.includes('disk')) return 'disk'
  if (paradigmId.includes('washer')) return 'washer'
  if (paradigmId.includes('shell')) return 'shell'
  return null
}

export function ParadigmVisualization({
  topicId,
  paradigm,
  sliderValues,
}: ParadigmVisualizationProps) {
  // Unit 1 — volumes of revolution
  if (topicId === 'volumes-disks-washers' || topicId === 'volumes-shells') {
    const revType = getRevolutionParadigm(paradigm.id)
    if (revType) {
      const fn = paradigm.inputs.type === 'single' ? paradigm.inputs.fn : 'x^2'
      const innerFn = paradigm.inputs.type === 'single' ? paradigm.inputs.fn2 : undefined
      const a = sliderValues.a ?? 0
      const b = sliderValues.b ?? 1

      let volume = 0
      const outerParsed = parseExpression(fn, ['x'])
      if (outerParsed.valid && outerParsed.fn) {
        volume = diskVolumeNumerical(outerParsed.fn, a, b, 500).volume
      }

      return (
        <div className="flex h-full flex-col gap-2 p-2">
          <div className="flex-1">
            <VolumesRevolutionScene
              paradigm={revType}
              sliderValues={sliderValues}
              fn={fn}
              innerFn={innerFn}
            />
          </div>
          <div className="shrink-0">
            <VolumeFormulaDisplay
              paradigm={revType}
              volume={volume}
              fn={fn}
              a={a}
              b={b}
              innerFn={innerFn}
            />
          </div>
        </div>
      )
    }
  }

  // Unit 2 — integration techniques: 2D function plots
  if (topicId.includes('integration') || topicId.includes('techniques')) {
    const fn = paradigm.inputs.type === 'single' ? paradigm.inputs.fn : 'sin(x)'
    const a = sliderValues.a ?? -3
    const b = sliderValues.b ?? 3
    return (
      <div className="h-full w-full">
        <FunctionPlot2D fn={fn} xMin={a} xMax={b} label={paradigm.title} />
      </div>
    )
  }

  // Unit 3 — sequences & series
  if (topicId.includes('series') || topicId.includes('sequence') || topicId.includes('taylor')) {
    const fn = paradigm.inputs.type === 'single' ? paradigm.inputs.fn : 'sin(x)'
    const degree = Math.round(sliderValues.degree ?? 5)
    if (paradigm.id.includes('partial') || paradigm.id.includes('sum')) {
      const termFn = (n: number) => {
        const parsed = parseExpression(fn, ['n'])
        if (!parsed.valid || !parsed.fn) return 0
        return parsed.fn({ n }) as number
      }
      return (
        <div className="h-full w-full">
          <PartialSumsScene termFn={termFn} numTerms={Math.round(sliderValues.terms ?? 20)} label={paradigm.title} />
        </div>
      )
    }
    return (
      <div className="h-full w-full">
        <TaylorSeriesScene fn={fn} x0={sliderValues.x0 ?? 0} degree={degree} xMin={-4} xMax={4} />
      </div>
    )
  }

  // Unit 4 — parametric & polar
  if (topicId.includes('parametric')) {
    const xFn = paradigm.inputs.type === 'parametric' ? paradigm.inputs.xFn ?? 'cos(t)' : 'cos(t)'
    const yFn = paradigm.inputs.type === 'parametric' ? paradigm.inputs.yFn ?? 'sin(t)' : 'sin(t)'
    return (
      <div className="h-full w-full">
        <ParametricCurveScene xFn={xFn} yFn={yFn} tMin={0} tMax={6.28} />
      </div>
    )
  }

  if (topicId.includes('polar')) {
    const rFn = paradigm.inputs.type === 'single' ? paradigm.inputs.fn : '1 + cos(θ)'
    return (
      <div className="h-full w-full">
        <PolarCurveScene rFn={rFn} thetaMin={0} thetaMax={6.28} />
      </div>
    )
  }

  // Fallback for unimplemented topics
  return (
    <div className="flex h-full items-center justify-center text-gray-500">
      <p>Visualization coming soon for <strong className="text-gray-300">{paradigm.title}</strong></p>
    </div>
  )
}
