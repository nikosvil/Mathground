// Course registry types
export interface SliderConfig {
  id: string
  label: string
  min: number
  max: number
  step: number
  default: number
}

export interface SingleInputSchema {
  type: 'single'
  variable: 'x' | 't' | 'θ'
  label: string
}

export interface ParametricInputSchema {
  type: 'parametric'
  variables: ['t']
  labels: ['x(t)', 'y(t)']
}

export type CustomInputSchema = SingleInputSchema | ParametricInputSchema

export interface Paradigm {
  id: string
  label: string
  description: string
  visualizationComponent: string
  customInputSchema: CustomInputSchema
  defaultSliders: SliderConfig[]
}

export interface Topic {
  id: string
  title: string
  thomasSection: string
  thomasPageStart: number
  paradigms: Paradigm[]
  defaultParadigm: string
}

export interface Unit {
  id: string
  title: string
  thomasChapters: number[]
  topics: Topic[]
}

export interface Course {
  id: string
  title: string
  description: string
  units: Unit[]
}

// AI types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  timestamp: number
}

export interface StreamChunk {
  type: 'content' | 'thinking' | 'done'
  delta: string
  error?: string
}

// RAG types
export interface ChunkMetadata {
  id: string
  source: string
  page: number
  chunkIndex: number
  totalChunks: number
}

export interface Chunk {
  text: string
  metadata: ChunkMetadata
}

export interface RetrievedChunk extends Chunk {
  score: number
}

// Math parser
export interface ParseResult {
  valid: boolean
  error?: string
  fn?: (scope: Record<string, number>) => number
}
