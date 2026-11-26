'use client'

import { create } from 'zustand'
import type { ChatMessage, SliderConfig } from '@/lib/types'

export interface MathgroundStore {
  // Active navigation
  activeCourseId: string | null
  activeUnitId: string | null
  activeTopicId: string | null
  activeParadigmId: string | null

  // Math input state
  sliderValues: Record<string, number>
  customFunction: string
  customFunctionX: string
  customFunctionY: string

  // Step walkthrough
  currentStep: number
  totalSteps: number
  isAnimating: boolean

  // Camera
  cameraPreset: '3d' | 'side' | 'top'

  // AI tutor
  chatHistory: ChatMessage[]
  isTutorOpen: boolean
  tutorMode: 'chat' | 'reasoning'
  isStreaming: boolean
  topicTitle: string | null
  paradigmLabel: string | null

  // Session
  sessionId: string

  // Actions
  setActiveTopic(courseId: string, unitId: string, topicId: string, defaultParadigmId: string): void
  setActiveParadigm(paradigmId: string): void
  initSliders(configs: SliderConfig[]): void
  updateSlider(id: string, value: number): void
  setCustomFunction(fn: string): void
  setCustomFunctionX(fn: string): void
  setCustomFunctionY(fn: string): void
  nextStep(): void
  prevStep(): void
  setTotalSteps(n: number): void
  resetSteps(): void
  setCameraPreset(preset: '3d' | 'side' | 'top'): void
  setTutorContext(topicTitle: string, paradigmLabel: string): void
  addMessage(msg: ChatMessage): void
  appendToLastMessage(delta: string): void
  appendToLastThinking(delta: string): void
  setIsStreaming(v: boolean): void
  toggleTutor(): void
  setTutorMode(mode: 'chat' | 'reasoning'): void
}

function getOrCreateSessionId(): string {
  try {
    const stored = sessionStorage.getItem('mathground-session-id')
    if (stored) return stored
    const id = crypto.randomUUID()
    sessionStorage.setItem('mathground-session-id', id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export const useMathgroundStore = create<MathgroundStore>((set) => ({
  activeCourseId: null,
  activeUnitId: null,
  activeTopicId: null,
  activeParadigmId: null,

  sliderValues: {},
  customFunction: '',
  customFunctionX: '',
  customFunctionY: '',

  currentStep: 0,
  totalSteps: 0,
  isAnimating: false,

  cameraPreset: '3d',

  chatHistory: [],
  isTutorOpen: false,
  tutorMode: 'chat',
  isStreaming: false,
  topicTitle: null,
  paradigmLabel: null,

  sessionId: getOrCreateSessionId(),

  setActiveTopic: (courseId, unitId, topicId, defaultParadigmId) =>
    set({
      activeCourseId: courseId,
      activeUnitId: unitId,
      activeTopicId: topicId,
      activeParadigmId: defaultParadigmId,
      currentStep: 0,
    }),

  setActiveParadigm: (paradigmId) => set({ activeParadigmId: paradigmId }),

  initSliders: (configs) =>
    set({
      sliderValues: Object.fromEntries(configs.map((c) => [c.id, c.default])),
    }),

  updateSlider: (id, value) =>
    set((state) => ({ sliderValues: { ...state.sliderValues, [id]: value } })),

  setCustomFunction: (fn) => set({ customFunction: fn }),
  setCustomFunctionX: (fn) => set({ customFunctionX: fn }),
  setCustomFunctionY: (fn) => set({ customFunctionY: fn }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),

  setTotalSteps: (n) => set({ totalSteps: n }),
  resetSteps: () => set({ currentStep: 0 }),

  setCameraPreset: (preset) => set({ cameraPreset: preset }),

  setTutorContext: (topicTitle, paradigmLabel) => set({ topicTitle, paradigmLabel }),

  addMessage: (msg) =>
    set((state) => ({ chatHistory: [...state.chatHistory, msg] })),

  appendToLastMessage: (delta) =>
    set((state) => {
      const history = [...state.chatHistory]
      if (history.length === 0) return {}
      const last = { ...history[history.length - 1] }
      last.content += delta
      history[history.length - 1] = last
      return { chatHistory: history }
    }),

  appendToLastThinking: (delta) =>
    set((state) => {
      const history = [...state.chatHistory]
      if (history.length === 0) return {}
      const last = { ...history[history.length - 1] }
      last.thinking = (last.thinking ?? '') + delta
      history[history.length - 1] = last
      return { chatHistory: history }
    }),

  setIsStreaming: (v) => set({ isStreaming: v }),
  toggleTutor: () => set((state) => ({ isTutorOpen: !state.isTutorOpen })),
  setTutorMode: (mode) => set({ tutorMode: mode }),
}))
