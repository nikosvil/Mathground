'use client'

import { useEffect } from 'react'
import { useMathgroundStore } from '@/lib/store'
import { TopicBreadcrumb } from '@/components/ui/TopicBreadcrumb'
import { SliderPanel } from '@/components/ui/SliderPanel'
import { StepController } from '@/components/visualization/StepController'
import { CameraPresets } from '@/components/visualization/CameraPresets'
import { ChatPanel } from '@/components/tutor/ChatPanel'
import { ParadigmVisualization } from '@/components/units/ParadigmVisualization'
import type { Course, Unit, Topic } from '@/lib/types'

interface TopicPageClientProps {
  course: Course
  unit: Unit
  topic: Topic
}

export function TopicPageClient({ course, unit, topic }: TopicPageClientProps) {
  const {
    activeParadigmId,
    sliderValues,
    currentStep,
    totalSteps,
    cameraPreset,
    setActiveTopic,
    setActiveParadigm,
    initSliders,
    updateSlider,
    nextStep,
    prevStep,
    resetSteps,
    setCameraPreset,
  } = useMathgroundStore()

  // Initialize store on topic change
  useEffect(() => {
    setActiveTopic(course.id, unit.id, topic.id)
    const firstParadigm = topic.paradigms[0]
    if (firstParadigm) {
      setActiveParadigm(firstParadigm.id)
      if (firstParadigm.inputs.type === 'single' || firstParadigm.inputs.type === 'parametric') {
        initSliders(firstParadigm.inputs.sliders)
      }
    }
  }, [topic.id, course.id, unit.id])

  const activeParadigm = topic.paradigms.find((p) => p.id === activeParadigmId) ?? topic.paradigms[0]

  const sliders =
    activeParadigm?.inputs.type === 'single' || activeParadigm?.inputs.type === 'parametric'
      ? activeParadigm.inputs.sliders
      : []

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-gray-800 px-6 py-3">
        <TopicBreadcrumb unit={unit.title} topic={topic.title} />
        <CameraPresets onSelect={setCameraPreset} current={cameraPreset} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: paradigm selector + sliders */}
        <aside className="flex w-64 flex-col gap-4 overflow-y-auto border-r border-gray-800 p-4">
          {/* Paradigm tabs */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">View</p>
            <div className="flex flex-col gap-1">
              {topic.paradigms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveParadigm(p.id)
                    if (p.inputs.type === 'single' || p.inputs.type === 'parametric') {
                      initSliders(p.inputs.sliders)
                    }
                  }}
                  className={`rounded-md px-3 py-1.5 text-left text-sm transition ${
                    p.id === activeParadigm?.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          {sliders.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Parameters</p>
              <SliderPanel
                sliders={sliders}
                values={sliderValues}
                onChange={updateSlider}
              />
            </div>
          )}
        </aside>

        {/* Main: canvas */}
        <div className="relative flex flex-1 flex-col">
          <div className="flex-1">
            {activeParadigm && (
              <ParadigmVisualization
                courseId={course.id}
                unitId={unit.id}
                topicId={topic.id}
                paradigm={activeParadigm}
                sliderValues={sliderValues}
                cameraPreset={cameraPreset}
              />
            )}
          </div>

          {/* Step controller */}
          {totalSteps > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <StepController
                currentStep={currentStep}
                totalSteps={totalSteps}
                onNext={nextStep}
                onPrev={prevStep}
                onReset={resetSteps}
              />
            </div>
          )}
        </div>
      </div>

      <ChatPanel />
    </div>
  )
}
