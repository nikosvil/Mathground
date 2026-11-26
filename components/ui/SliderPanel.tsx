'use client'

import type { SliderConfig } from '@/lib/types'

interface SliderPanelProps {
  sliders: SliderConfig[]
  values: Record<string, number>
  onChange: (id: string, value: number) => void
}

export function SliderPanel({ sliders, values, onChange }: SliderPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {sliders.map((s) => (
        <div key={s.id} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <label htmlFor={`slider-${s.id}`} className="text-gray-300">
              {s.label}
            </label>
            <span className="font-mono text-xs text-gray-400">
              {(values[s.id] ?? s.default).toFixed(2)}
            </span>
          </div>
          <input
            id={`slider-${s.id}`}
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={values[s.id] ?? s.default}
            onChange={(e) => onChange(s.id, parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-blue-500"
          />
        </div>
      ))}
    </div>
  )
}
