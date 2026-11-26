'use client'

interface StepControllerProps {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onReset: () => void
}

export function StepController({ currentStep, totalSteps, onNext, onPrev, onReset }: StepControllerProps) {
  return (
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
  )
}
