'use client'

import { useEffect } from 'react'

interface StepControllerProps {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onReset: () => void
}

export function StepController({ currentStep, totalSteps, onNext, onPrev, onReset }: StepControllerProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' && currentStep < totalSteps) onNext()
      if (e.key === 'ArrowLeft' && currentStep > 1) onPrev()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [currentStep, totalSteps, onNext, onPrev])

  const pct = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  return (
    <div className="flex flex-col gap-1.5">
      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        className="h-1 w-full overflow-hidden rounded-full bg-white/10"
      >
        <div
          data-testid="step-progress-fill"
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 rounded-lg bg-gray-900/80 px-4 py-2 text-sm text-white backdrop-blur">
        <button
          onClick={onPrev}
          disabled={currentStep <= 1}
          className="rounded px-3 py-1 font-medium transition hover:bg-white/10 disabled:opacity-30"
          aria-label="Prev step"
        >
          Prev
        </button>

        <span className="min-w-[90px] text-center text-gray-300">
          Step {currentStep} of {totalSteps}
        </span>

        <button
          onClick={onNext}
          disabled={currentStep >= totalSteps}
          className="rounded px-3 py-1 font-medium transition hover:bg-white/10 disabled:opacity-30"
          aria-label="Next step"
        >
          Next
        </button>

        <button
          onClick={onReset}
          className="ml-2 rounded px-2 py-1 text-xs text-gray-400 transition hover:text-white"
          aria-label="Reset steps"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
