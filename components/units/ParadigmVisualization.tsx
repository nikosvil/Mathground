'use client'

import type { Paradigm } from '@/lib/types'
import { VolumesRevolutionScene } from './unit1/VolumesRevolutionScene'
import { VolumeFormulaDisplay } from './unit1/VolumeFormulaDisplay'
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

  // Fallback for unimplemented topics
  return (
    <div className="flex h-full items-center justify-center text-gray-500">
      <p>Visualization coming soon for <strong className="text-gray-300">{paradigm.title}</strong></p>
    </div>
  )
}
