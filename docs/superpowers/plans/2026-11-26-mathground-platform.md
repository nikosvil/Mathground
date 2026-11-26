# Mathground Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Mathground platform — Next.js 15 monorepo with LanceDB RAG pipeline over Thomas' Calculus 11E, DeepSeek SSE tutor, and all Calculus II interactive visualizations.

**Architecture:** Next.js 15 App Router monorepo; Route Handlers serve the SSE/RAG backend; all R3F canvas components are `dynamic(..., { ssr: false })`; Zustand manages visualization state; LanceDB + local all-MiniLM-L6-v2 embeddings power retrieval.

**Tech Stack:** Next.js 15, TypeScript, @react-three/fiber, @react-three/drei, three.js, mathjs, KaTeX, Tailwind CSS v4, Zustand, openai SDK (DeepSeek-compatible), @xenova/transformers, lancedb, pdf-parse, Vitest, @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-11-26-mathground-design.md`

## Global Constraints

- `DEEPSEEK_API_KEY` only in `.env.local`; never referenced in any file under `app/` client boundary or `components/`
- All math expression parsing via `mathjs` `evaluate` with an explicit allowed-symbols scope — no `eval()`, no `new Function()`
- Every R3F component file must be imported with `dynamic(() => import(...), { ssr: false })`
- LanceDB table data persists under `./data/vectors/` (add to `.gitignore`)
- Embedding model cache under `./data/model-cache/` (add to `.gitignore`)
- Three.js geometries and materials must be disposed in component `useEffect` cleanup
- `sessionId` (uuid) is stored in `sessionStorage` and sent with every `/api/chat` call; server accepts but does not enforce it
- Topic URL structure: `/courses/[courseId]/[unitId]/[topicId]` — IDs are kebab-case strings defined in the course registry
- Test runner: Vitest (`npx vitest run`); Three.js WebGL is mocked globally in `vitest.setup.ts`

## Review Focus

1. **mathjs implicit multiplication** (`2x` instead of `2*x`): `parseExpression` must return `{ valid: false, error: "Use * for multiplication: 2*x" }` — tested in Task 3.
2. **SSE chunk boundary splitting**: DeepSeek may deliver `data:` lines split across TCP packets; the client `ReadableStream` decoder must buffer incomplete lines before parsing JSON — tested in Task 7.
3. **NaN/Infinity in geometry generators**: a valid expression like `1/x` on `[−1, 1]` crosses a discontinuity; generators must clamp or skip NaN vertices rather than crash Three.js — tested in Task 3.
4. **Three.js geometry disposal**: R3F components that recreate geometry on slider change must dispose the previous `BufferGeometry` and `Material` before assigning the new one — verified in Task 8's render loop test.
5. **LanceDB cold-start (table not yet ingested)**: `retrieveChunks` must return `[]` gracefully when the table does not exist, never throw — tested in Task 6.

---

## File Map

```
# Configuration
package.json
next.config.ts
tailwind.config.ts
tsconfig.json
vitest.config.ts
vitest.setup.ts
.env.local.example
.gitignore

# Types & Store
lib/types.ts                             ← all shared interfaces (Course, Unit, Topic, Paradigm, ChatMessage, StreamChunk, Chunk, RetrievedChunk)
lib/store/index.ts                       ← Zustand MathgroundStore + createStore

# Course Registry
lib/courses/registry.ts                  ← getCourse / getUnit / getTopic / getParadigm
lib/courses/calc2/index.ts               ← Calculus II Course object
lib/courses/calc2/units/applications.ts  ← Unit 1 topics + paradigms
lib/courses/calc2/units/techniques.ts    ← Unit 2 topics + paradigms
lib/courses/calc2/units/series.ts        ← Unit 3 topics + paradigms
lib/courses/calc2/units/parametric-polar.ts ← Unit 4 topics + paradigms

# Math Utilities
lib/math/parser.ts                       ← parseExpression (mathjs sandboxed)
lib/math/geometry/revolution.ts          ← diskGeometry / washerGeometry / shellGeometry
lib/math/geometry/series.ts              ← taylorPoints / partialSumPoints
lib/math/geometry/polar.ts               ← polarCurvePoints
lib/math/geometry/parametric.ts          ← parametricCurvePoints

# RAG Pipeline
lib/rag/chunker.ts                       ← chunkPdfText → Chunk[]
lib/rag/ingest.ts                        ← ingestChunks (embed + upsert LanceDB)
lib/rag/retrieve.ts                      ← retrieveChunks (query → embed → ANN)
scripts/ingest-pdf.ts                    ← CLI: node scripts/ingest-pdf.ts <PDF_PATH>

# AI Backend
lib/ai/deepseek.ts                       ← streamDeepSeek (AsyncGenerator<StreamChunk>)
lib/ai/prompts.ts                        ← buildSystemPrompt(context: PromptContext)
app/api/chat/route.ts                    ← POST → SSE ReadableStream
app/api/ingest/route.ts                  ← POST → trigger ingestion (NODE_ENV check)

# Shared Visualization Engine
components/visualizations/shared/MathCanvas.tsx      ← Base R3F canvas (mode: 2d|3d)
components/visualizations/shared/AxisLabels.tsx       ← 3D axis ticks via <Html>
components/visualizations/shared/StepController.tsx   ← step state machine UI
components/visualizations/shared/CameraPresets.tsx    ← camera preset buttons

# UI Components
components/ui/AITutor/ChatPanel.tsx       ← SSE consumer + message list + input
components/ui/AITutor/MessageBubble.tsx   ← KaTeX + collapsible thinking block
components/ui/FunctionInput.tsx            ← validated expression input
components/ui/ParadigmSelector.tsx         ← paradigm tab picker
components/ui/LatexDisplay.tsx             ← KaTeX inline/block renderer
components/ui/SliderPanel.tsx              ← slider row + live formula readout

# App Shell
app/layout.tsx
app/page.tsx                              ← course selector landing
app/courses/[courseId]/page.tsx           ← course overview
app/courses/[courseId]/[unitId]/[topicId]/page.tsx  ← split-screen topic page

# Unit 1 Visualizations
components/visualizations/calc2/VolumesRevolution/index.tsx
components/visualizations/calc2/AreasBetweenCurves/index.tsx
components/visualizations/calc2/ArcLength/index.tsx
components/visualizations/calc2/SurfaceRevolution/index.tsx
components/visualizations/calc2/CentersOfMass/index.tsx
components/visualizations/calc2/Work/index.tsx
components/visualizations/calc2/FluidPressure/index.tsx

# Unit 2 Visualizations
components/visualizations/calc2/TrigSubstitution/index.tsx
components/visualizations/calc2/ImproperIntegrals/index.tsx
components/visualizations/calc2/PartialFractions/index.tsx
components/visualizations/calc2/IntegrationByParts/index.tsx
components/visualizations/calc2/NumericalIntegration/index.tsx
components/visualizations/calc2/TrigIntegrals/index.tsx

# Unit 3 Visualizations
components/visualizations/calc2/Sequences/index.tsx
components/visualizations/calc2/SeriesPartialSums/index.tsx
components/visualizations/calc2/ConvergenceTests/index.tsx
components/visualizations/calc2/AlternatingSeries/index.tsx
components/visualizations/calc2/PowerSeries/index.tsx
components/visualizations/calc2/TaylorSeries/index.tsx

# Unit 4 Visualizations
components/visualizations/calc2/ParametricCurves/index.tsx
components/visualizations/calc2/PolarCurves/index.tsx
components/visualizations/calc2/PolarAreaArcLength/index.tsx
components/visualizations/calc2/ConicSections/index.tsx
components/visualizations/calc2/ConicsInPolar/index.tsx

# Tests
tests/lib/math/parser.test.ts
tests/lib/math/geometry/revolution.test.ts
tests/lib/math/geometry/series.test.ts
tests/lib/math/geometry/polar.test.ts
tests/lib/math/geometry/parametric.test.ts
tests/lib/rag/chunker.test.ts
tests/lib/rag/retrieve.test.ts
tests/lib/courses/registry.test.ts
tests/lib/ai/prompts.test.ts
tests/lib/ai/deepseek.test.ts
tests/api/chat.test.ts
tests/components/ui/FunctionInput.test.tsx
tests/components/ui/AITutor/MessageBubble.test.tsx
tests/components/visualizations/shared/MathCanvas.test.tsx
```

---

### Task 1: Project Scaffolding, Dependencies & Zustand Store

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Create: `.env.local.example`, `.gitignore`
- Create: `lib/types.ts`
- Create: `lib/store/index.ts`

**Interfaces:**
- Produces: `MathgroundStore` (Zustand store), all shared types in `lib/types.ts`

---

- [ ] **Step 1: Initialise Next.js 15 project with TypeScript and Tailwind**

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir=no --import-alias="@/*" --eslint=no
```

- [ ] **Step 2: Install all dependencies**

```bash
npm install three @react-three/fiber @react-three/drei mathjs katex zustand openai lancedb pdf-parse @xenova/transformers uuid
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @types/three @types/katex @types/uuid
```

- [ ] **Step 3: Configure `next.config.ts`**

Add `transpilePackages: ['three']`; set `experimental.serverComponentsExternalPackages: ['lancedb', '@xenova/transformers', 'pdf-parse']`; set `webpack` config to alias `canvas` to false (prevents jsdom canvas error in Next.js build).

- [ ] **Step 4: Configure `vitest.config.ts`**

Use `@vitejs/plugin-react`; set `environment: 'jsdom'`; set `setupFiles: ['./vitest.setup.ts']`; add `alias: { '@': path.resolve(__dirname, '.') }`.

- [ ] **Step 5: Create `vitest.setup.ts`**

Mock `three`'s `WebGLRenderer` to a no-op class. Import `@testing-library/jest-dom/vitest`. Add `global.ResizeObserver = vi.fn(...)` stub.

- [ ] **Step 6: Write shared types in `lib/types.ts`**

Define and export:
```typescript
// Course registry types
export interface SliderConfig { id: string; label: string; min: number; max: number; step: number; default: number }
export interface SingleInputSchema { type: 'single'; variable: 'x' | 't' | 'θ'; label: string }
export interface ParametricInputSchema { type: 'parametric'; variables: ['t']; labels: ['x(t)', 'y(t)'] }
export type CustomInputSchema = SingleInputSchema | ParametricInputSchema
export interface Paradigm { id: string; label: string; description: string; visualizationComponent: string; customInputSchema: CustomInputSchema; defaultSliders: SliderConfig[] }
export interface Topic { id: string; title: string; thomasSection: string; thomasPageStart: number; paradigms: Paradigm[]; defaultParadigm: string }
export interface Unit { id: string; title: string; thomasChapters: number[]; topics: Topic[] }
export interface Course { id: string; title: string; description: string; units: Unit[] }

// AI types
export interface ChatMessage { role: 'user' | 'assistant'; content: string; thinkingContent?: string; timestamp: number }
export interface StreamChunk { type: 'content' | 'thinking' | 'done'; delta: string }

// RAG types
export interface ChunkMetadata { source: string; chapter: number; section: string; pageStart: number; chunkType: 'body' | 'theorem' | 'definition' | 'example'; tokenCount: number }
export interface Chunk { text: string; metadata: ChunkMetadata }
export interface RetrievedChunk extends Chunk { score: number }

// Math parser
export interface ParseResult { valid: boolean; error?: string; fn?: (scope: Record<string, number>) => number }
```

- [ ] **Step 7: Write `lib/store/index.ts`**

Define `MathgroundStore` with these exact fields and actions:
```typescript
// Fields
activeCourseId: string | null
activeUnitId: string | null
activeTopicId: string | null
activeParadigmId: string | null
sliderValues: Record<string, number>
customFunction: string
customFunctionX: string
customFunctionY: string
currentStep: number
totalSteps: number
isAnimating: boolean
cameraPreset: '3d' | 'side' | 'top'
chatHistory: ChatMessage[]
isTutorOpen: boolean
tutorMode: 'chat' | 'reasoning'
isStreaming: boolean
sessionId: string   // initialised from sessionStorage or crypto.randomUUID()

// Actions (exact names — later tasks import these)
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
addMessage(msg: ChatMessage): void
appendToLastMessage(delta: string): void
appendToLastThinking(delta: string): void
setIsStreaming(v: boolean): void
toggleTutor(): void
setTutorMode(mode: 'chat' | 'reasoning'): void
```

Use `create` from Zustand; initialise `sessionId` with a try/catch on `sessionStorage` (falls back to `crypto.randomUUID()` if unavailable).

- [ ] **Step 8: Create `.env.local.example`**

```
DEEPSEEK_API_KEY=sk-...
PDF_PATH=/path/to/Thomas-Calculus-11E.pdf
LANCEDB_PATH=./data/vectors
MODEL_CACHE_PATH=./data/model-cache
```

- [ ] **Step 9: Update `.gitignore`**

Add: `.env.local`, `data/vectors/`, `data/model-cache/`

- [ ] **Step 10: Verify build succeeds**

```bash
npx tsc --noEmit && npx next build
```
Expected: clean TypeScript compile; build succeeds.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with Zustand store and shared types"
```

---

### Task 2: Course Registry & Full Calculus II Curriculum

**Files:**
- Create: `lib/courses/registry.ts`
- Create: `lib/courses/calc2/index.ts`
- Create: `lib/courses/calc2/units/applications.ts`
- Create: `lib/courses/calc2/units/techniques.ts`
- Create: `lib/courses/calc2/units/series.ts`
- Create: `lib/courses/calc2/units/parametric-polar.ts`
- Create: `tests/lib/courses/registry.test.ts`

**Interfaces:**
- Consumes: `Course`, `Unit`, `Topic`, `Paradigm`, `SliderConfig` from `lib/types.ts`
- Produces: `getCourse(id)`, `getUnit(courseId, unitId)`, `getTopic(courseId, unitId, topicId)`, `getParadigm(courseId, unitId, topicId, paradigmId)`; all Calc II topic/paradigm IDs

---

- [ ] **Step 1: Write failing tests**

```typescript
// tests/lib/courses/registry.test.ts
it('getCourse("calc2") returns a course with 4 units', () => {
  const c = getCourse('calc2')
  expect(c?.units).toHaveLength(4)
})
it('getTopic("calc2","applications","volumes-disks-washers") exists', () => {
  expect(getTopic('calc2','applications','volumes-disks-washers')).toBeDefined()
})
it('getTopic for unknown id returns undefined', () => {
  expect(getTopic('calc2','applications','does-not-exist')).toBeUndefined()
})
it('every topic has at least 1 paradigm', () => {
  const course = getCourse('calc2')!
  for (const unit of course.units)
    for (const topic of unit.topics)
      expect(topic.paradigms.length).toBeGreaterThanOrEqual(1)
})
it('every paradigm defaultSliders are within [min, max]', () => {
  const course = getCourse('calc2')!
  for (const unit of course.units)
    for (const topic of unit.topics)
      for (const p of topic.paradigms)
        for (const s of p.defaultSliders)
          expect(s.default).toBeGreaterThanOrEqual(s.min)
})
```

- [ ] **Step 2: Run tests — expect all to fail**

```bash
npx vitest run tests/lib/courses/registry.test.ts
```

- [ ] **Step 3: Implement `lib/courses/registry.ts`**

Export four lookup functions that search the registry array. Registry is a `Course[]` populated by importing each course module.

```typescript
export function getCourse(id: string): Course | undefined
export function getUnit(courseId: string, unitId: string): Unit | undefined
export function getTopic(courseId: string, unitId: string, topicId: string): Topic | undefined
export function getParadigm(courseId: string, unitId: string, topicId: string, paradigmId: string): Paradigm | undefined
```

- [ ] **Step 4: Implement `lib/courses/calc2/units/applications.ts` (Unit 1)**

Unit id: `'applications'`, title: `'Applications of Definite Integrals'`, `thomasChapters: [6]`

Topics (use these exact IDs — they form URL segments):
| id | title | thomasSection | thomasPageStart |
|----|-------|--------------|-----------------|
| `areas-between-curves` | Areas Between Curves | §6.1 | (find in Thomas) |
| `volumes-disks-washers` | Volumes by Disks & Washers | §6.2 | — |
| `volumes-shells` | Volumes by Cylindrical Shells | §6.3 | — |
| `arc-length` | Arc Length | §6.3 | — |
| `surface-revolution` | Areas of Surfaces of Revolution | §6.5 | — |
| `centers-of-mass` | Moments & Centers of Mass | §6.4 | — |
| `work` | Work | §6.6 | — |
| `fluid-pressure` | Fluid Pressures & Forces | §6.7 | — |

Each topic needs ≥3 paradigms. The `visualizationComponent` string must match the directory name under `components/visualizations/calc2/` (e.g., `'VolumesRevolution'`). Slider ids are free-form; keep them short (e.g., `'n'`, `'a'`, `'b'`, `'k'`).

- [ ] **Step 5: Implement `lib/courses/calc2/units/techniques.ts` (Unit 2)**

Unit id: `'techniques'`, title: `'Techniques of Integration'`, `thomasChapters: [8]`

Topics:
| id | title | thomasSection |
|----|-------|--------------|
| `basic-formulas` | Basic Integration Formulas | §8.1 |
| `integration-by-parts` | Integration by Parts | §8.2 |
| `partial-fractions` | Partial Fractions | §8.3 |
| `trig-integrals` | Trigonometric Integrals | §8.4 |
| `trig-substitution` | Trigonometric Substitution | §8.5 |
| `numerical-integration` | Numerical Integration | §8.7 |
| `improper-integrals` | Improper Integrals | §8.8 |

- [ ] **Step 6: Implement `lib/courses/calc2/units/series.ts` (Unit 3)**

Unit id: `'series'`, title: `'Infinite Sequences & Series'`, `thomasChapters: [11]`

Topics:
| id | title | thomasSection |
|----|-------|--------------|
| `sequences` | Sequences | §11.1 |
| `infinite-series` | Infinite Series & Partial Sums | §11.2 |
| `convergence-tests` | Convergence Tests | §11.3–11.5 |
| `alternating-series` | Alternating Series | §11.6 |
| `power-series` | Power Series | §11.7–11.8 |
| `taylor-maclaurin` | Taylor & Maclaurin Series | §11.9–11.10 |
| `fourier-series` | Fourier Series | §11.11 |

- [ ] **Step 7: Implement `lib/courses/calc2/units/parametric-polar.ts` (Unit 4)**

Unit id: `'parametric-polar'`, title: `'Parametric Equations & Polar Coordinates'`, `thomasChapters: [10]`

Topics:
| id | title | thomasSection |
|----|-------|--------------|
| `parametric-curves` | Parametric Curves | §10.4 |
| `polar-coordinates` | Polar Coordinates | §10.5–10.6 |
| `polar-area-arc-length` | Area & Arc Length in Polar | §10.7 |
| `conic-sections` | Conic Sections | §10.1–10.3 |
| `conics-in-polar` | Conics in Polar Coordinates | §10.8 |

- [ ] **Step 8: Implement `lib/courses/calc2/index.ts`**

Assemble the `Course` object from the four unit files. Register it in `lib/courses/registry.ts`.

- [ ] **Step 9: Run tests — expect all to pass**

```bash
npx vitest run tests/lib/courses/registry.test.ts
```

- [ ] **Step 10: Commit**

```bash
git add lib/courses/ tests/lib/courses/
git commit -m "feat: add course registry and complete Calculus II curriculum definition"
```

---

### Task 3: Math Expression Parser & Geometry Generators

**Files:**
- Create: `lib/math/parser.ts`
- Create: `lib/math/geometry/revolution.ts`
- Create: `lib/math/geometry/series.ts`
- Create: `lib/math/geometry/polar.ts`
- Create: `lib/math/geometry/parametric.ts`
- Create: `tests/lib/math/parser.test.ts`
- Create: `tests/lib/math/geometry/revolution.test.ts`
- Create: `tests/lib/math/geometry/series.test.ts`
- Create: `tests/lib/math/geometry/polar.test.ts`
- Create: `tests/lib/math/geometry/parametric.test.ts`

**Interfaces:**
- Consumes: `ParseResult` from `lib/types.ts`
- Produces: `parseExpression`, `diskGeometry`, `washerGeometry`, `shellGeometry`, `taylorPoints`, `partialSumPoints`, `polarCurvePoints`, `parametricCurvePoints`

---

- [ ] **Step 1: Write failing parser tests**

```typescript
// tests/lib/math/parser.test.ts
it('parses valid expression sin(x)', () => {
  const r = parseExpression('sin(x)', ['x'])
  expect(r.valid).toBe(true)
  expect(r.fn!({ x: 0 })).toBeCloseTo(0)
  expect(r.fn!({ x: Math.PI / 2 })).toBeCloseTo(1)
})
it('rejects implicit multiplication', () => {
  const r = parseExpression('2x', ['x'])
  expect(r.valid).toBe(false)
  expect(r.error).toMatch(/\*/)  // error message mentions *
})
it('rejects disallowed symbol', () => {
  const r = parseExpression('process.exit(1)', ['x'])
  expect(r.valid).toBe(false)
})
it('rejects empty string', () => {
  expect(parseExpression('', ['x']).valid).toBe(false)
})
it('handles x^2 + 1', () => {
  const r = parseExpression('x^2 + 1', ['x'])
  expect(r.fn!({ x: 3 })).toBeCloseTo(10)
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npx vitest run tests/lib/math/parser.test.ts
```

- [ ] **Step 3: Implement `lib/math/parser.ts`**

```typescript
export function parseExpression(expression: string, allowedVariables: string[]): ParseResult
```

Use `mathjs.parse` then `mathjs.compile`; before compilation, check the parse tree for any `SymbolNode` whose name is not in `allowedVariables` and not a mathjs built-in (use `mathjs.Unit.isValuelessUnit` or a known-safe set). Catch parse errors and return `{ valid: false, error: e.message }`. The returned `fn` calls `compiled.evaluate(scope)` and returns the number.

- [ ] **Step 4: Run parser tests — expect pass**

```bash
npx vitest run tests/lib/math/parser.test.ts
```

- [ ] **Step 5: Write failing geometry tests**

```typescript
// tests/lib/math/geometry/revolution.test.ts
it('diskGeometry for f(x)=1 on [0,1] has correct vertex count', () => {
  const r = parseExpression('1', ['x'])
  const geo = diskGeometry(r.fn!, 0, 1, 20, 'x', 0)
  // 20 disk slices, each a circle: (20 + 1) radial segments × 20 slices
  expect(geo.attributes.position.count).toBeGreaterThan(0)
})
it('diskGeometry for f(x)=1 on [0,1] volume ≈ π', () => {
  const r = parseExpression('1', ['x'])
  const { volume } = diskVolumeNumerical(r.fn!, 0, 1, 1000)
  expect(volume).toBeCloseTo(Math.PI, 2)
})
it('washerGeometry for f=1, g=0.5 on [0,1] returns geometry', () => {
  const outer = parseExpression('1', ['x']).fn!
  const inner = parseExpression('0.5', ['x']).fn!
  const geo = washerGeometry(outer, inner, 0, 1, 20)
  expect(geo.attributes.position.count).toBeGreaterThan(0)
})
it('diskGeometry clamps NaN vertices (1/x near 0)', () => {
  const r = parseExpression('1/x', ['x'])
  expect(() => diskGeometry(r.fn!, -1, 1, 50, 'x', 0)).not.toThrow()
})

// tests/lib/math/geometry/series.test.ts
it('taylorPoints for sin(x) degree 1 at x0=0 approximates correctly', () => {
  const pts = taylorPoints('sin(x)', 0, 1, -1, 1, 100)
  // degree-1 taylor of sin at 0 is x; at x=0.5, ≈0.5
  const pt = pts.find(p => Math.abs(p.x - 0.5) < 0.02)!
  expect(pt.y).toBeCloseTo(0.5, 1)
})
it('partialSumPoints for geometric series (a=0.5) converges to 2', () => {
  const pts = partialSumPoints(n => Math.pow(0.5, n), 50)
  expect(pts[49].partial).toBeCloseTo(2, 1)
})

// tests/lib/math/geometry/polar.test.ts
it('polarCurvePoints for r=1 produces unit circle', () => {
  const pts = polarCurvePoints('1', 0, 2 * Math.PI, 360)
  const xs = pts.map(p => p.x)
  expect(Math.max(...xs)).toBeCloseTo(1, 1)
  expect(Math.min(...xs)).toBeCloseTo(-1, 1)
})

// tests/lib/math/geometry/parametric.test.ts
it('parametricCurvePoints for x=cos(t),y=sin(t) traces unit circle', () => {
  const pts = parametricCurvePoints('cos(t)', 'sin(t)', 0, 2 * Math.PI, 360)
  const maxR = Math.max(...pts.map(p => Math.sqrt(p.x ** 2 + p.y ** 2)))
  expect(maxR).toBeCloseTo(1, 1)
})
```

- [ ] **Step 6: Run — expect failure**

```bash
npx vitest run tests/lib/math/geometry/
```

- [ ] **Step 7: Implement `lib/math/geometry/revolution.ts`**

```typescript
import * as THREE from 'three'
import type { ParseResult } from '@/lib/types'

export function diskGeometry(
  fn: (scope: Record<string, number>) => number,
  a: number, b: number,
  nSlices: number,
  axis: 'x' | 'y',
  axisOffset: number
): THREE.BufferGeometry

export function washerGeometry(
  outer: (scope: Record<string, number>) => number,
  inner: (scope: Record<string, number>) => number,
  a: number, b: number,
  nSlices: number
): THREE.BufferGeometry

export function shellGeometry(
  fn: (scope: Record<string, number>) => number,
  a: number, b: number,
  nSlices: number
): THREE.BufferGeometry

// Helper used in tests
export function diskVolumeNumerical(
  fn: (scope: Record<string, number>) => number,
  a: number, b: number,
  n: number
): { volume: number }
```

For NaN/Infinity protection: in the loop that generates radii, replace any `isNaN(r) || !isFinite(r)` values with `0` before passing to Three.js.

Use `THREE.LatheGeometry` for disk/washer (simplest correct approach), or manually build `BufferGeometry` with indexed triangles if axis rotation is needed.

- [ ] **Step 8: Implement `lib/math/geometry/series.ts`**

```typescript
export function taylorPoints(
  fnExpression: string,  // e.g. 'sin(x)'
  x0: number,
  degree: number,
  xMin: number,
  xMax: number,
  numPoints: number
): { x: number; y: number }[]

export function partialSumPoints(
  termFn: (n: number) => number,
  N: number
): { n: number; partial: number }[]
```

For `taylorPoints`: compute Taylor coefficients via numerical differentiation (`mathjs.derivative` or finite differences); evaluate the resulting polynomial at `numPoints` evenly spaced x values.

- [ ] **Step 9: Implement `lib/math/geometry/polar.ts`**

```typescript
export function polarCurvePoints(
  rExpression: string,
  thetaMin: number,
  thetaMax: number,
  numPoints: number
): { x: number; y: number; theta: number; r: number }[]
```

Parse `rExpression` with `parseExpression(rExpression, ['θ'])`; evaluate at each θ; convert to Cartesian. Clamp negative r to 0 (convention for plotting purposes).

- [ ] **Step 10: Implement `lib/math/geometry/parametric.ts`**

```typescript
export function parametricCurvePoints(
  xExpression: string,
  yExpression: string,
  tMin: number,
  tMax: number,
  numPoints: number
): { x: number; y: number; t: number }[]
```

Parse both expressions with `parseExpression(..., ['t'])`; return `[]` if either is invalid.

- [ ] **Step 11: Run all geometry tests — expect pass**

```bash
npx vitest run tests/lib/math/
```

- [ ] **Step 12: Commit**

```bash
git add lib/math/ tests/lib/math/
git commit -m "feat: add math expression parser and geometry generators"
```

---

### Task 4: RAG — PDF Chunker & Ingestion Script

**Files:**
- Create: `lib/rag/chunker.ts`
- Create: `lib/rag/ingest.ts`
- Create: `scripts/ingest-pdf.ts`
- Create: `tests/lib/rag/chunker.test.ts`

**Interfaces:**
- Consumes: `Chunk`, `ChunkMetadata` from `lib/types.ts`
- Produces: `chunkPdfText(text, targetTokens): Chunk[]`; `ingestChunks(chunks): Promise<void>`

---

- [ ] **Step 1: Write failing chunker tests**

```typescript
// tests/lib/rag/chunker.test.ts
const SAMPLE = `Chapter 6\nSection 6.1\nThe area between curves...` +
  'x '.repeat(300) +
  '\nTHEOREM 1\nIf f and g are...' +
  'y '.repeat(100)

it('produces at least 2 chunks from sample text', () => {
  const chunks = chunkPdfText(SAMPLE, 200)
  expect(chunks.length).toBeGreaterThanOrEqual(2)
})
it('no chunk exceeds 1.5× target token count', () => {
  const chunks = chunkPdfText(SAMPLE, 200)
  for (const c of chunks)
    expect(c.metadata.tokenCount).toBeLessThanOrEqual(300)
})
it('detects theorem chunk type', () => {
  const chunks = chunkPdfText(SAMPLE, 500)
  expect(chunks.some(c => c.metadata.chunkType === 'theorem')).toBe(true)
})
it('preserves chapter number in metadata', () => {
  const chunks = chunkPdfText(SAMPLE, 500)
  expect(chunks[0].metadata.chapter).toBe(6)
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npx vitest run tests/lib/rag/chunker.test.ts
```

- [ ] **Step 3: Implement `lib/rag/chunker.ts`**

```typescript
export function chunkPdfText(
  text: string,
  targetTokens: number   // approximate; 1 token ≈ 4 chars
): Chunk[]
```

Strategy:
1. Split on section-header patterns: `/^(Chapter \d+|Section \d+\.\d+|THEOREM|DEFINITION|EXAMPLE)/m`
2. For each segment, if it exceeds `targetTokens * 1.5` chars, split further on paragraph breaks
3. Set `chunkType` based on the leading keyword; default `'body'`
4. Extract `chapter` from the most recent "Chapter N" header seen; `section` from "Section X.Y"
5. `tokenCount` = `Math.ceil(text.length / 4)`
6. `pageStart` is 0 (pdf-parse doesn't give per-chunk page; acceptable for MVP)
7. `source` = `"Thomas' Calculus 11E"`

- [ ] **Step 4: Run chunker tests — expect pass**

```bash
npx vitest run tests/lib/rag/chunker.test.ts
```

- [ ] **Step 5: Implement `lib/rag/ingest.ts`**

```typescript
export async function ingestChunks(chunks: Chunk[]): Promise<{ inserted: number }>
```

Steps inside:
1. Load `@xenova/transformers` pipeline `'feature-extraction'` with model `'Xenova/all-MiniLM-L6-v2'`; set `env.cacheDir` to `process.env.MODEL_CACHE_PATH ?? './data/model-cache'`
2. Connect to LanceDB at `process.env.LANCEDB_PATH ?? './data/vectors'`
3. Embed chunks in batches of 32; get 384-dim float32 vectors via mean pooling
4. Open or create table `'thomas_calculus'` with schema `{ vector: Float32Array(384), text: string, source: string, chapter: number, section: string, pageStart: number, chunkType: string }`
5. Upsert all rows; return `{ inserted: chunks.length }`

- [ ] **Step 6: Implement `scripts/ingest-pdf.ts`**

CLI script: `npx ts-node scripts/ingest-pdf.ts`

```typescript
// reads PDF_PATH from env or first CLI arg
// calls pdf-parse to get full text
// calls chunkPdfText(text, 500)
// calls ingestChunks(chunks)
// logs progress: "Chunked N chunks. Embedding... Done."
```

Add `"ingest": "ts-node scripts/ingest-pdf.ts"` to `package.json` scripts.

- [ ] **Step 7: Commit**

```bash
git add lib/rag/chunker.ts lib/rag/ingest.ts scripts/ tests/lib/rag/chunker.test.ts
git commit -m "feat: add RAG PDF chunker and ingestion pipeline"
```

---

### Task 5: RAG — Retrieval

**Files:**
- Create: `lib/rag/retrieve.ts`
- Create: `tests/lib/rag/retrieve.test.ts`

**Interfaces:**
- Consumes: `ingestChunks` schema; `RetrievedChunk` from `lib/types.ts`
- Produces: `retrieveChunks(query, options): Promise<RetrievedChunk[]>`

---

- [ ] **Step 1: Write failing retrieval tests**

```typescript
// tests/lib/rag/retrieve.test.ts
// These tests use a real LanceDB in a tmp directory
import { ingestChunks } from '@/lib/rag/ingest'
import { retrieveChunks } from '@/lib/rag/retrieve'

const TEST_CHUNKS: Chunk[] = [
  { text: 'The disk method formula is V = π∫R²dx', metadata: { source: 'test', chapter: 6, section: '6.2', pageStart: 1, chunkType: 'theorem', tokenCount: 10 } },
  { text: 'Integration by parts: ∫u dv = uv - ∫v du', metadata: { source: 'test', chapter: 8, section: '8.2', pageStart: 2, chunkType: 'theorem', tokenCount: 10 } },
]

beforeAll(async () => {
  process.env.LANCEDB_PATH = '/tmp/test-vectors-' + Date.now()
  process.env.MODEL_CACHE_PATH = './data/model-cache'
  await ingestChunks(TEST_CHUNKS)
})

it('returns top chunk for disk method query', async () => {
  const results = await retrieveChunks('disk method volume', { topK: 1 })
  expect(results).toHaveLength(1)
  expect(results[0].text).toContain('disk')
}, 60_000)

it('returns empty array when table does not exist', async () => {
  process.env.LANCEDB_PATH = '/tmp/nonexistent-' + Date.now()
  const results = await retrieveChunks('anything', { topK: 3 })
  expect(results).toEqual([])
})

it('chapter filter returns only chapter 8 chunks', async () => {
  process.env.LANCEDB_PATH = ...  // restore test db path
  const results = await retrieveChunks('integration', { topK: 2, chapterFilter: [8] })
  for (const r of results) expect(r.metadata.chapter).toBe(8)
}, 60_000)
```

- [ ] **Step 2: Run — expect failure**

```bash
npx vitest run tests/lib/rag/retrieve.test.ts
```

- [ ] **Step 3: Implement `lib/rag/retrieve.ts`**

```typescript
export async function retrieveChunks(
  query: string,
  options: { topK: number; chapterFilter?: number[] }
): Promise<RetrievedChunk[]>
```

Steps inside:
1. Wrap in try/catch; return `[]` on any error (covers missing table)
2. Connect to LanceDB; check if table `'thomas_calculus'` exists; if not, return `[]`
3. Embed `query` with the same pipeline/model as ingestion (re-use module-level cached pipeline)
4. Run `.search(queryVector).limit(options.topK)` on the table
5. If `chapterFilter` is set, add `.filter(\`chapter IN (${chapterFilter.join(',')})\`)`
6. Map rows to `RetrievedChunk`: reconstruct `metadata` from row fields; set `score` from LanceDB `_distance` field (convert distance to similarity score: `score = 1 - _distance`)

- [ ] **Step 4: Run retrieval tests — expect pass**

```bash
npx vitest run tests/lib/rag/retrieve.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/rag/retrieve.ts tests/lib/rag/retrieve.test.ts
git commit -m "feat: add RAG semantic retrieval with LanceDB"
```

---

### Task 6: DeepSeek AI Backend & SSE Route

**Files:**
- Create: `lib/ai/deepseek.ts`
- Create: `lib/ai/prompts.ts`
- Create: `app/api/chat/route.ts`
- Create: `app/api/ingest/route.ts`
- Create: `tests/lib/ai/prompts.test.ts`
- Create: `tests/lib/ai/deepseek.test.ts`
- Create: `tests/api/chat.test.ts`

**Interfaces:**
- Consumes: `retrieveChunks`; `StreamChunk`, `RetrievedChunk`, `ChatMessage` from `lib/types.ts`
- Produces: `streamDeepSeek`; `buildSystemPrompt`; `/api/chat` SSE endpoint

---

- [ ] **Step 1: Write failing prompt tests**

```typescript
// tests/lib/ai/prompts.test.ts
it('buildSystemPrompt includes topic title', () => {
  const prompt = buildSystemPrompt({
    topicTitle: 'Volumes by Disks',
    paradigmLabel: 'Disk Method',
    sliderValues: { n: 20, a: 0, b: 3 },
    ragChunks: [],
  })
  expect(prompt).toContain('Volumes by Disks')
  expect(prompt).toContain('Disk Method')
})
it('buildSystemPrompt includes formatted RAG chunks', () => {
  const chunk: RetrievedChunk = {
    text: 'V = π∫R²dx',
    score: 0.9,
    metadata: { source: "Thomas' Calculus 11E", chapter: 6, section: '6.2', pageStart: 342, chunkType: 'theorem', tokenCount: 5 },
  }
  const prompt = buildSystemPrompt({ topicTitle: 'T', paradigmLabel: 'P', sliderValues: {}, ragChunks: [chunk] })
  expect(prompt).toContain('[§6.2, p.342]')
  expect(prompt).toContain('V = π∫R²dx')
})
it('buildSystemPrompt includes slider values', () => {
  const prompt = buildSystemPrompt({ topicTitle: 'T', paradigmLabel: 'P', sliderValues: { n: 42 }, ragChunks: [] })
  expect(prompt).toContain('n = 42')
})
```

- [ ] **Step 2: Write failing SSE format test**

```typescript
// tests/lib/ai/deepseek.test.ts
// Mock the openai SDK
vi.mock('openai', () => ({ default: vi.fn().mockReturnValue({ chat: { completions: { create: vi.fn() } } }) }))

it('yields content chunks from streaming response', async () => {
  const mockStream = [
    { choices: [{ delta: { content: 'Hello ' } }] },
    { choices: [{ delta: { content: 'world' } }] },
    { choices: [{ delta: {} }] },   // end
  ]
  // set up mock to return async iterable
  const chunks: StreamChunk[] = []
  for await (const c of streamDeepSeek([], 'deepseek-chat', 'sys')) chunks.push(c)
  const content = chunks.filter(c => c.type === 'content').map(c => c.delta).join('')
  expect(content).toBe('Hello world')
})

it('yields thinking chunks for deepseek-reasoner', async () => {
  const mockStream = [
    { choices: [{ delta: { reasoning_content: 'Let me think...' } }] },
    { choices: [{ delta: { content: 'Answer.' } }] },
  ]
  // set up mock
  const chunks: StreamChunk[] = []
  for await (const c of streamDeepSeek([], 'deepseek-reasoner', 'sys')) chunks.push(c)
  expect(chunks.some(c => c.type === 'thinking')).toBe(true)
  expect(chunks.some(c => c.type === 'content')).toBe(true)
})
```

- [ ] **Step 3: Run — expect failure**

```bash
npx vitest run tests/lib/ai/
```

- [ ] **Step 4: Implement `lib/ai/prompts.ts`**

```typescript
export interface PromptContext {
  topicTitle: string
  paradigmLabel: string
  sliderValues: Record<string, number>
  customFunction?: string
  ragChunks: RetrievedChunk[]
}

export function buildSystemPrompt(context: PromptContext): string
```

Build a multi-section string:
```
You are a friendly, rigorous Calculus II tutor...

## Current Visualization State
- Topic: {topicTitle}
- Paradigm: {paradigmLabel}
- Sliders: {Object.entries(sliderValues).map(([k,v]) => `${k} = ${v}`).join(', ')}

## Textbook Context (Thomas' Calculus 11E)
{ragChunks.map(c => `[§${c.metadata.section}, p.${c.metadata.pageStart}] "${c.text}"`).join('\n')}

## Instructions
Explain concepts intuitively first...
```

- [ ] **Step 5: Implement `lib/ai/deepseek.ts`**

```typescript
import OpenAI from 'openai'

export async function* streamDeepSeek(
  messages: OpenAI.ChatCompletionMessageParam[],
  model: 'deepseek-chat' | 'deepseek-reasoner',
  systemPrompt: string
): AsyncGenerator<StreamChunk>
```

Create `new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com' })`. Call `client.chat.completions.create({ model, messages: [{ role: 'system', content: systemPrompt }, ...messages], stream: true })`. For each chunk: if `delta.reasoning_content` yield `{ type: 'thinking', delta: ... }`; if `delta.content` yield `{ type: 'content', delta: ... }`. After loop, yield `{ type: 'done', delta: '' }`.

- [ ] **Step 6: Run AI tests — expect pass**

```bash
npx vitest run tests/lib/ai/
```

- [ ] **Step 7: Implement `app/api/chat/route.ts`**

```typescript
export const runtime = 'nodejs'

export async function POST(req: Request): Promise<Response>
```

Parse body: `{ messages, context, mode }`. Call `retrieveChunks(messages.at(-1).content, { topK: 5, chapterFilter: thomasChaptersForContext(context) })`. Call `buildSystemPrompt(...)`. Create a `ReadableStream` that:
1. Reads from `streamDeepSeek(messages, model, systemPrompt)`
2. Encodes each `StreamChunk` as `data: ${JSON.stringify(chunk)}\n\n`
3. Closes on `type === 'done'`

Return `new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })`.

Helper: `thomasChaptersForContext(context)` → looks up the active unit's `thomasChapters` from the registry.

- [ ] **Step 8: Implement `app/api/ingest/route.ts`**

```typescript
export async function POST(): Promise<Response>
```

Check `process.env.NODE_ENV !== 'development'` → return `403`. Otherwise call the ingestion pipeline and return `{ inserted }`.

- [ ] **Step 9: Write and run API route test**

```typescript
// tests/api/chat.test.ts
// Mock retrieveChunks and streamDeepSeek
it('POST /api/chat returns SSE stream', async () => {
  const req = new Request('http://localhost/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages: [{ role: 'user', content: 'explain disks' }], context: { courseId: 'calc2', unitId: 'applications', topicId: 'volumes-disks-washers', paradigmId: 'disk', sliderValues: {}, sessionId: 'test' }, mode: 'chat' }),
  })
  const res = await POST(req)
  expect(res.headers.get('Content-Type')).toContain('text/event-stream')
})
```

```bash
npx vitest run tests/api/chat.test.ts
```

- [ ] **Step 10: Commit**

```bash
git add lib/ai/ app/api/ tests/lib/ai/ tests/api/
git commit -m "feat: add DeepSeek SSE backend with RAG context injection"
```

---

### Task 7: Shared Visualization Engine

**Files:**
- Create: `components/visualizations/shared/MathCanvas.tsx`
- Create: `components/visualizations/shared/AxisLabels.tsx`
- Create: `components/visualizations/shared/StepController.tsx`
- Create: `components/visualizations/shared/CameraPresets.tsx`
- Create: `tests/components/visualizations/shared/MathCanvas.test.tsx`

**Interfaces:**
- Consumes: `MathgroundStore` actions from `lib/store/index.ts`
- Produces: `MathCanvas`, `AxisLabels`, `StepController`, `CameraPresets`

---

- [ ] **Step 1: Write failing MathCanvas test**

```typescript
// tests/components/visualizations/shared/MathCanvas.test.tsx
it('renders without crashing in 3d mode', () => {
  render(<MathCanvas mode="3d"><mesh /></MathCanvas>)
  // should not throw
})
it('renders without crashing in 2d mode', () => {
  render(<MathCanvas mode="2d"><mesh /></MathCanvas>)
})
it('does not render camera preset buttons in 2d mode', () => {
  const { queryByText } = render(<MathCanvas mode="2d"><mesh /></MathCanvas>)
  expect(queryByText('3D')).toBeNull()
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npx vitest run tests/components/visualizations/shared/
```

- [ ] **Step 3: Implement `components/visualizations/shared/MathCanvas.tsx`**

```typescript
'use client'

interface MathCanvasProps {
  mode: '2d' | '3d'
  children: React.ReactNode
  className?: string
}

export function MathCanvas({ mode, children, className }: MathCanvasProps): JSX.Element
```

Renders a `<Canvas>` from `@react-three/fiber`. In `'3d'` mode: perspective camera at `[5, 5, 5]`, fov 50, `OrbitControls` with `enableDamping`. In `'2d'` mode: orthographic camera, `OrbitControls` with `enableRotate={false}`. Both modes include: `<ambientLight intensity={0.4} />`, `<directionalLight position={[10,10,5]} intensity={0.8} />`, `<Grid args={[20,20]} cellColor="#444" sectionColor="#666" />`. Also renders `<CameraPresets />` only when `mode === '3d'`.

- [ ] **Step 4: Implement `components/visualizations/shared/AxisLabels.tsx`**

Renders three `<Html>` elements (from `@react-three/drei`) positioned at axis ends, labeled `x`, `y`, `z`. Accepts `size?: number` prop (default 5) for axis extent.

- [ ] **Step 5: Implement `components/visualizations/shared/CameraPresets.tsx`**

```typescript
'use client'
export function CameraPresets(): JSX.Element
```

Renders three buttons: "3D" / "Side" / "Top". On click, uses `useThree` to set camera position:
- `'3d'`: `[5, 5, 5]`, look at origin
- `'side'`: `[10, 0, 0]`, look at origin
- `'top'`: `[0, 10, 0]`, look at origin

Also renders a "Reset Camera" button that returns to the current preset's position.

- [ ] **Step 6: Implement `components/visualizations/shared/StepController.tsx`**

```typescript
'use client'

interface StepControllerProps {
  steps: string[]   // e.g. ['Slice', 'Revolve', 'Sum n→∞']
}

export function StepController({ steps }: StepControllerProps): JSX.Element
```

Renders "◀ [Step label] ▶" with Previous/Next buttons. Uses `currentStep`, `nextStep`, `prevStep`, `setTotalSteps` from the Zustand store. On mount, calls `setTotalSteps(steps.length)`.

- [ ] **Step 7: Run shared component tests — expect pass**

```bash
npx vitest run tests/components/visualizations/shared/
```

- [ ] **Step 8: Commit**

```bash
git add components/visualizations/shared/ tests/components/visualizations/shared/
git commit -m "feat: add shared R3F visualization engine (MathCanvas, AxisLabels, StepController)"
```

---

### Task 8: App Shell & Shared UI Components

**Files:**
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/courses/[courseId]/page.tsx`
- Create: `app/courses/[courseId]/[unitId]/[topicId]/page.tsx`
- Create: `components/ui/LatexDisplay.tsx`
- Create: `components/ui/FunctionInput.tsx`
- Create: `components/ui/ParadigmSelector.tsx`
- Create: `components/ui/SliderPanel.tsx`
- Create: `tests/components/ui/FunctionInput.test.tsx`

**Interfaces:**
- Consumes: `getCourse`, `getTopic`, `getParadigm`; `MathgroundStore`; `parseExpression`
- Produces: navigable app shell; all UI control components

---

- [ ] **Step 1: Write failing FunctionInput tests**

```typescript
// tests/components/ui/FunctionInput.test.tsx
it('calls onChange with valid expression', async () => {
  const onChange = vi.fn()
  const { getByRole } = render(<FunctionInput variable="x" value="" onChange={onChange} />)
  await userEvent.type(getByRole('textbox'), 'sin(x)')
  await userEvent.keyboard('{Enter}')
  expect(onChange).toHaveBeenCalledWith('sin(x)', true)
})
it('shows error for invalid expression', async () => {
  const onChange = vi.fn()
  const { getByRole, findByText } = render(<FunctionInput variable="x" value="" onChange={onChange} />)
  await userEvent.type(getByRole('textbox'), '2x')
  await userEvent.keyboard('{Enter}')
  expect(await findByText(/\*/)).toBeTruthy()   // error message mentions *
  expect(onChange).not.toHaveBeenCalledWith(expect.any(String), true)
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npx vitest run tests/components/ui/FunctionInput.test.tsx
```

- [ ] **Step 3: Implement `components/ui/LatexDisplay.tsx`**

```typescript
'use client'
interface LatexDisplayProps { latex: string; block?: boolean; className?: string }
export function LatexDisplay({ latex, block, className }: LatexDisplayProps): JSX.Element
```

Use `katex.renderToString(latex, { displayMode: block ?? false, throwOnError: false })`; render via `dangerouslySetInnerHTML`. Catch KaTeX errors; render raw string as fallback.

- [ ] **Step 4: Implement `components/ui/FunctionInput.tsx`**

```typescript
'use client'
interface FunctionInputProps {
  variable: 'x' | 't' | 'θ'
  label?: string
  value: string
  onChange: (expression: string, valid: boolean) => void
  placeholder?: string
}
export function FunctionInput(props: FunctionInputProps): JSX.Element
```

Controlled input. On change, call `parseExpression(value, [variable])`; display error below input if invalid; call `props.onChange(value, result.valid)`.

- [ ] **Step 5: Implement `components/ui/ParadigmSelector.tsx`**

```typescript
'use client'
interface ParadigmSelectorProps {
  paradigms: Paradigm[]
  activeId: string
  onSelect: (id: string) => void
}
export function ParadigmSelector(props: ParadigmSelectorProps): JSX.Element
```

Renders a row of pill/tab buttons. Active paradigm highlighted. Clicking calls `onSelect(id)`.

- [ ] **Step 6: Implement `components/ui/SliderPanel.tsx`**

```typescript
'use client'
interface SliderPanelProps {
  configs: SliderConfig[]
  values: Record<string, number>
  onChange: (id: string, value: number) => void
  formula?: string   // LaTeX string updated in real time
}
export function SliderPanel(props: SliderPanelProps): JSX.Element
```

Renders one `<input type="range">` per config with label (via `LatexDisplay`) and current numeric value. Renders `formula` via `LatexDisplay` below the sliders.

- [ ] **Step 7: Implement `app/layout.tsx`**

Root layout with Tailwind base, dark background, top navbar (`Mathground | [breadcrumb]`). Wrap in `<Providers>` client component that initialises the Zustand store.

- [ ] **Step 8: Implement `app/page.tsx`**

Landing page. Call `getCourse('calc2')`; render unit cards linking to `/courses/calc2/[unitId]`.

- [ ] **Step 9: Implement `app/courses/[courseId]/page.tsx`**

Course overview. List topics in each unit as cards linking to `/courses/[courseId]/[unitId]/[topicId]`.

- [ ] **Step 10: Implement `app/courses/[courseId]/[unitId]/[topicId]/page.tsx`**

Split-screen layout (60/40):
- **Left (60%):** Dynamic import of the topic's visualization component (resolved from `paradigm.visualizationComponent`). Camera presets below. `StepController` below canvas.
- **Right (40%):** `ParadigmSelector` → `SliderPanel` → live formula `LatexDisplay` → `FunctionInput` (or dual inputs for parametric). AI Tutor panel below (collapsed by default).

On mount: call `setActiveTopic(courseId, unitId, topicId, topic.defaultParadigm)` and `initSliders(activeParadigm.defaultSliders)`.

- [ ] **Step 11: Run FunctionInput tests — expect pass**

```bash
npx vitest run tests/components/ui/FunctionInput.test.tsx
```

- [ ] **Step 12: Verify app starts and routes work**

```bash
npm run dev
```

Navigate to `http://localhost:3000` and confirm landing, course, and a topic page (e.g. `/courses/calc2/applications/volumes-disks-washers`) all render without errors.

- [ ] **Step 13: Commit**

```bash
git add app/ components/ui/ tests/components/ui/
git commit -m "feat: add app shell, navigation, and shared UI controls"
```

---

### Task 9: AI Tutor Panel

**Files:**
- Create: `components/ui/AITutor/ChatPanel.tsx`
- Create: `components/ui/AITutor/MessageBubble.tsx`
- Create: `tests/components/ui/AITutor/MessageBubble.test.tsx`

**Interfaces:**
- Consumes: `MathgroundStore` (`chatHistory`, `addMessage`, `appendToLastMessage`, `appendToLastThinking`, `setIsStreaming`, `tutorMode`, `sessionId`); `/api/chat` SSE endpoint
- Produces: fully-wired AI tutor panel

---

- [ ] **Step 1: Write failing MessageBubble tests**

```typescript
// tests/components/ui/AITutor/MessageBubble.test.tsx
it('renders LaTeX in content', () => {
  const { container } = render(
    <MessageBubble message={{ role: 'assistant', content: 'The formula is $V = \\pi r^2$', timestamp: 0 }} />
  )
  expect(container.querySelector('.katex')).toBeTruthy()
})
it('renders collapsible thinking block when thinkingContent present', async () => {
  const { getByText, queryByText } = render(
    <MessageBubble message={{ role: 'assistant', content: 'Answer', thinkingContent: 'Internal reasoning', timestamp: 0 }} />
  )
  expect(getByText(/Thinking/i)).toBeTruthy()
  expect(queryByText('Internal reasoning')).toBeNull()   // collapsed by default
  await userEvent.click(getByText(/Thinking/i))
  expect(queryByText('Internal reasoning')).toBeTruthy()
})
it('does not render thinking block when thinkingContent absent', () => {
  const { queryByText } = render(
    <MessageBubble message={{ role: 'assistant', content: 'Hello', timestamp: 0 }} />
  )
  expect(queryByText(/Thinking/i)).toBeNull()
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npx vitest run tests/components/ui/AITutor/MessageBubble.test.tsx
```

- [ ] **Step 3: Implement `components/ui/AITutor/MessageBubble.tsx`**

```typescript
'use client'
interface MessageBubbleProps { message: ChatMessage }
export function MessageBubble({ message }: MessageBubbleProps): JSX.Element
```

Renders user messages in a right-aligned bubble. For assistant messages:
1. If `thinkingContent` is present, render a `<details>` / `<summary>Thinking…</summary>` block containing the thinking text as plain text (not KaTeX — reasoning may contain non-LaTeX prose).
2. Split `content` on `$$...$$` and `$...$`; render math spans via `LatexDisplay`, prose spans as plain text.

- [ ] **Step 4: Implement `components/ui/AITutor/ChatPanel.tsx`**

```typescript
'use client'
export function ChatPanel(): JSX.Element
```

Layout: message list (scrollable) + input row + mode toggle. 

**SSE consumption:**
```typescript
async function sendMessage(userContent: string) {
  addMessage({ role: 'user', content: userContent, timestamp: Date.now() })
  addMessage({ role: 'assistant', content: '', timestamp: Date.now() })
  setIsStreaming(true)
  const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ messages, context, mode }) })
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()!   // keep incomplete line in buffer
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const chunk: StreamChunk = JSON.parse(line.slice(6))
      if (chunk.type === 'content') appendToLastMessage(chunk.delta)
      if (chunk.type === 'thinking') appendToLastThinking(chunk.delta)
      if (chunk.type === 'done') setIsStreaming(false)
    }
  }
}
```

Include a toggle button between "Chat" and "Reasoning" that calls `setTutorMode`.

- [ ] **Step 5: Run MessageBubble tests — expect pass**

```bash
npx vitest run tests/components/ui/AITutor/
```

- [ ] **Step 6: Integrate ChatPanel into topic page**

In `app/courses/[courseId]/[unitId]/[topicId]/page.tsx`: add `<ChatPanel />` below the right-side controls, inside a collapsible section driven by `isTutorOpen` from the store.

- [ ] **Step 7: Commit**

```bash
git add components/ui/AITutor/ tests/components/ui/AITutor/
git commit -m "feat: add AI tutor panel with SSE streaming and KaTeX rendering"
```

---

### Task 10: Unit 1 — Volumes of Revolution (Flagship Visualization)

**Files:**
- Create: `components/visualizations/calc2/VolumesRevolution/index.tsx`
- Create: `components/visualizations/calc2/VolumesRevolution/DiskScene.tsx`
- Create: `components/visualizations/calc2/VolumesRevolution/WasherScene.tsx`
- Create: `components/visualizations/calc2/VolumesRevolution/ShellScene.tsx`

**Interfaces:**
- Consumes: `diskGeometry`, `washerGeometry`, `shellGeometry`; `MathCanvas`, `StepController`; store slider values + customFunction
- Produces: `VolumesRevolution` (default export, dynamically imported in topic page)

---

- [ ] **Step 1: Implement `components/visualizations/calc2/VolumesRevolution/DiskScene.tsx`**

`'use client'` + `useEffect` for geometry disposal.

Props none — reads `sliderValues` (`n`, `a`, `b`), `customFunction` / `customFunctionX` from store.

Steps shown via `StepController`: `['Slice the region', 'Revolve each slice', 'Sum as n → ∞']`

Default paradigm uses `f(x) = √x`, `a = 0`, `b = 4`. Renders:
- The 2D curve as a `<Line>` from `@react-three/drei`
- Disk slices as `diskGeometry` meshes with `MeshPhongMaterial` (blue, 70% transparent)
- As `n` increases (slider), slices thin out toward the smooth solid

Dispose geometry in `useEffect` cleanup.

- [ ] **Step 2: Implement `WasherScene.tsx`**

Default: outer `f(x) = √x`, inner `g(x) = x/2`, `a = 0`, `b = 4`. Renders outer and inner curves as lines, washer geometry as `washerGeometry` mesh with two colors (outer blue, inner red transparent).

Steps: `['Identify outer and inner curves', 'Subtract inner disk from outer', 'Sum washers as n → ∞']`

- [ ] **Step 3: Implement `ShellScene.tsx`**

Default: `f(x) = x²`, `a = 0`, `b = 1`, revolution around y-axis. Renders thin cylindrical shells via `shellGeometry`. Color: green, 60% transparent.

Steps: `['Draw a thin vertical strip', 'Rotate strip into a shell', 'Sum shells as n → ∞']`

- [ ] **Step 4: Implement `components/visualizations/calc2/VolumesRevolution/index.tsx`**

Reads `activeParadigmId` from store. Renders `DiskScene`, `WasherScene`, or `ShellScene` based on active paradigm. Wraps each in `<MathCanvas mode="3d">`.

Paradigm ids: `'disk'`, `'washer'`, `'shell'`, `'shifted-axis'`, `'custom'`.

For `'shifted-axis'`: use `DiskScene` with axis offset `k` from slider (revolution around `y = k`). For `'custom'`: expose `FunctionInput` and use `customFunction` from store.

- [ ] **Step 5: Verify visually in browser**

```bash
npm run dev
```

Navigate to `/courses/calc2/applications/volumes-disks-washers`. Switch between paradigms. Move `n` slider. Confirm: geometry updates without console errors, 60fps, no memory leaks after switching paradigms 5 times (check DevTools memory).

- [ ] **Step 6: Commit**

```bash
git add components/visualizations/calc2/VolumesRevolution/
git commit -m "feat: add Volumes of Revolution visualization (disk, washer, shell, shifted axis, custom)"
```

---

### Task 11: Unit 1 — Remaining Applications Visualizations

**Files:**
- Create: `components/visualizations/calc2/AreasBetweenCurves/index.tsx`
- Create: `components/visualizations/calc2/ArcLength/index.tsx`
- Create: `components/visualizations/calc2/SurfaceRevolution/index.tsx`
- Create: `components/visualizations/calc2/CentersOfMass/index.tsx`
- Create: `components/visualizations/calc2/Work/index.tsx`
- Create: `components/visualizations/calc2/FluidPressure/index.tsx`

---

- [ ] **Step 1: Implement `AreasBetweenCurves/index.tsx`**

`mode="2d"`. Default: `f(x) = x²`, `g(x) = x`. Renders both curves as 2D lines via `<Line>`. Fills the region between them with a semi-transparent `ShapeGeometry`. Paradigms: same side (f above g), crossed curves (intersection), horizontal slicing.

- [ ] **Step 2: Implement `ArcLength/index.tsx`**

`mode="2d"`. Default: `f(x) = sin(x)`, `a = 0`, `b = 2π`. Renders the curve and animates approximating line segments; as `n` increases, segments converge to arc length. Renders live numeric arc length estimate via `LatexDisplay`.

- [ ] **Step 3: Implement `SurfaceRevolution/index.tsx`**

`mode="3d"`. Default: `f(x) = √x`, `a = 0`, `b = 4`, revolution around x-axis. Renders the surface as a `THREE.TubeGeometry` (or lathe with open ends). Paradigms: around x-axis, around y-axis.

- [ ] **Step 4: Implement `CentersOfMass/index.tsx`**

`mode="2d"`. Renders a region between two curves. Shows center of mass as an animated dot. Slider: `a`, `b`, `ρ` (density factor). Live display: $\bar{x}$, $\bar{y}$ values.

- [ ] **Step 5: Implement `Work/index.tsx`**

`mode="2d"`. Renders force vs. displacement curve `F(x)`. Shaded area = work done. Paradigms: spring (Hooke's law `F = kx`), constant force, variable force. Sliders: `k`, `a`, `b`.

- [ ] **Step 6: Implement `FluidPressure/index.tsx`**

`mode="2d"`. Renders a cross-section of a submerged plate. Shows pressure increasing with depth (color gradient). Sliders: plate width, submersion depth. Live display: total force formula.

- [ ] **Step 7: Verify all topics navigate and render**

Visit each Unit 1 topic URL in the browser. No crash, no blank canvas, paradigm switching works.

- [ ] **Step 8: Commit**

```bash
git add components/visualizations/calc2/AreasBetweenCurves/ components/visualizations/calc2/ArcLength/ components/visualizations/calc2/SurfaceRevolution/ components/visualizations/calc2/CentersOfMass/ components/visualizations/calc2/Work/ components/visualizations/calc2/FluidPressure/
git commit -m "feat: add remaining Unit 1 visualizations (areas, arc length, surfaces, work, fluid, CoM)"
```

---

### Task 12: Unit 2 — Techniques of Integration Visualizations

**Files:**
- Create: `components/visualizations/calc2/TrigSubstitution/index.tsx`
- Create: `components/visualizations/calc2/ImproperIntegrals/index.tsx`
- Create: `components/visualizations/calc2/PartialFractions/index.tsx`
- Create: `components/visualizations/calc2/IntegrationByParts/index.tsx`
- Create: `components/visualizations/calc2/NumericalIntegration/index.tsx`
- Create: `components/visualizations/calc2/TrigIntegrals/index.tsx`

---

- [ ] **Step 1: Implement `TrigSubstitution/index.tsx`**

`mode="2d"`. Renders an interactive right triangle. Three paradigms:
- `√(a²-x²)`: triangle with hypotenuse `a`, adjacent `x`, opposite `√(a²-x²)`. Slider: `a`, `x`. Live display: substitution `x = a·sin(θ)`, `dx = a·cos(θ)dθ`.
- `√(a²+x²)`: triangle with legs `a`, `x`, hypotenuse `√(a²+x²)`.
- `√(x²-a²)`: triangle with hypotenuse `x`, adjacent `a`.

Render triangle using `<Line>` with labeled vertices. Animate θ with slider.

- [ ] **Step 2: Implement `ImproperIntegrals/index.tsx`**

`mode="2d"`. Two paradigms:
- Infinite upper bound: render `f(x) = 1/x^p` on `[1, B]`; slider `B` goes from 2 to 1000. Live display: integral value converges/diverges based on `p`. Slider `p`.
- Vertical asymptote: render `f(x) = 1/x^p` on `[ε, 1]`; slider `ε` goes from 0.001 to 0.5.

Color the area under the curve; show if convergent (finite shaded area) or divergent (unbounded growth annotation).

- [ ] **Step 3: Implement `PartialFractions/index.tsx`**

`mode="2d"`. Renders the original rational function and its partial fraction decomposition. Steps: show denominator factoring → pole locations on x-axis → decomposed terms as separate curves summing to original. Paradigms: distinct real roots, repeated root, irreducible quadratic.

- [ ] **Step 4: Implement `IntegrationByParts/index.tsx`**

`mode="2d"`. Renders the formula `∫u dv = uv - ∫v du`. Two paradigms:
- Geometric: rectangle decomposition showing `uv` area split into `∫u dv` and `∫v du`.
- Tabular: animated tabular method (alternating ± signs, differentiate u column, integrate dv column).

- [ ] **Step 5: Implement `NumericalIntegration/index.tsx`**

`mode="2d"`. Default: `f(x) = sin(x)`, `a = 0`, `b = π`. Three paradigms with live error display:
- Left/right/midpoint Riemann sums (n slider)
- Trapezoidal rule
- Simpson's rule

Color rectangles/trapezoids; display `|error|` between numerical and exact.

- [ ] **Step 6: Implement `TrigIntegrals/index.tsx`**

`mode="2d"`. Shows `sin^m(x)cos^n(x)` strategy selection. Sliders `m`, `n`. Display which reduction identity applies based on parity. Render the original integrand and the reduced form side by side.

- [ ] **Step 7: Verify all Unit 2 topics render**

Visit each Unit 2 topic URL. No crash, paradigm switching works.

- [ ] **Step 8: Commit**

```bash
git add components/visualizations/calc2/TrigSubstitution/ components/visualizations/calc2/ImproperIntegrals/ components/visualizations/calc2/PartialFractions/ components/visualizations/calc2/IntegrationByParts/ components/visualizations/calc2/NumericalIntegration/ components/visualizations/calc2/TrigIntegrals/
git commit -m "feat: add Unit 2 Techniques of Integration visualizations"
```

---

### Task 13: Unit 3 — Infinite Sequences & Series Visualizations

**Files:**
- Create: `components/visualizations/calc2/Sequences/index.tsx`
- Create: `components/visualizations/calc2/SeriesPartialSums/index.tsx`
- Create: `components/visualizations/calc2/ConvergenceTests/index.tsx`
- Create: `components/visualizations/calc2/AlternatingSeries/index.tsx`
- Create: `components/visualizations/calc2/PowerSeries/index.tsx`
- Create: `components/visualizations/calc2/TaylorSeries/index.tsx`

---

- [ ] **Step 1: Implement `Sequences/index.tsx`**

`mode="2d"`. Plots `a_n` vs `n` as a scatter/dot plot. Slider: `N` (number of terms to show). Paradigms: convergent (`1/n`), oscillating convergent (`(-1)^n/n`), divergent (`n`), bounded non-monotone (`sin(n)/n`). Dashed horizontal line at limit when convergent. Live display: limit value.

- [ ] **Step 2: Implement `SeriesPartialSums/index.tsx`**

`mode="2d"`. Renders stair-step chart: `S_N = Σ a_n` vs `N`. Plots both individual terms (bars) and partial sums (step line). Dashed horizontal line at the limit. Paradigms: geometric series `r = 0.5`, telescoping, harmonic (divergent — partial sums grow without bound).

- [ ] **Step 3: Implement `ConvergenceTests/index.tsx`**

`mode="2d"`. Renders test comparisons. Paradigms:
- Integral test: show `a_n` bars vs `f(x)` envelope curve; shade area; integral value determines convergence.
- Comparison test: two series `a_n` ≤ `b_n`; color code convergent/divergent.
- Ratio test: plot `|a_{n+1}/a_n|` vs `n`; horizontal lines at `L = 1`.
- Root test: plot `|a_n|^(1/n)` vs `n`.

- [ ] **Step 4: Implement `AlternatingSeries/index.tsx`**

`mode="2d"`. Partial sums zigzag toward limit. Renders partial sums as alternating overshoots that tighten. Shows error bound `|S - S_N| ≤ |a_{N+1}|` as a bracket. Slider: `N`.

- [ ] **Step 5: Implement `PowerSeries/index.tsx`**

`mode="2d"`. Renders partial sums of a power series `Σ c_n (x-a)^n` as curves. Slider: `N` (degree). Shows radius of convergence as vertical dashed lines. Paradigms: geometric power series, `1/(1-x)`, custom `c_n`.

- [ ] **Step 6: Implement `TaylorSeries/index.tsx`**

`mode="2d"`. Flagship Unit 3 visualization. Renders:
- The original function `f(x)` as a solid reference curve
- The degree-N Taylor polynomial `P_N(x)` as an animated overlay curve
- Slider `N` from 1 to 15; polynomial updates smoothly

Paradigms: `sin(x)` at `x₀ = 0`, `e^x` at `x₀ = 0`, `cos(x)` at `x₀ = 0`, `ln(1+x)` at `x₀ = 0`, custom `f(x)`.

Uses `taylorPoints` from `lib/math/geometry/series.ts`. Live display: truncated polynomial formula in LaTeX. As `N` increases, animate the curve morphing from `P_1` to `P_N`. Show error `|f(x) - P_N(x)|` as a secondary faded curve (optional toggle).

- [ ] **Step 7: Verify all Unit 3 topics render**

Visit each Unit 3 topic URL. Taylor Series: move `N` slider, confirm curve updates fluidly.

- [ ] **Step 8: Commit**

```bash
git add components/visualizations/calc2/Sequences/ components/visualizations/calc2/SeriesPartialSums/ components/visualizations/calc2/ConvergenceTests/ components/visualizations/calc2/AlternatingSeries/ components/visualizations/calc2/PowerSeries/ components/visualizations/calc2/TaylorSeries/
git commit -m "feat: add Unit 3 Infinite Sequences & Series visualizations"
```

---

### Task 14: Unit 4 — Parametric, Polar & Conics Visualizations

**Files:**
- Create: `components/visualizations/calc2/ParametricCurves/index.tsx`
- Create: `components/visualizations/calc2/PolarCurves/index.tsx`
- Create: `components/visualizations/calc2/PolarAreaArcLength/index.tsx`
- Create: `components/visualizations/calc2/ConicSections/index.tsx`
- Create: `components/visualizations/calc2/ConicsInPolar/index.tsx`

---

- [ ] **Step 1: Implement `ParametricCurves/index.tsx`**

`mode="2d"`. Renders `(x(t), y(t))` curve. Uses `parametricCurvePoints` from `lib/math/geometry/parametric.ts`.

Paradigms:
- Cycloid: `x = t - sin(t)`, `y = 1 - cos(t)`. Animate rolling circle.
- Circle: `x = cos(t)`, `y = sin(t)`. Velocity tangent vector animated.
- Lissajous: `x = sin(2t)`, `y = sin(3t)`.
- Custom: dual `FunctionInput` for `x(t)` and `y(t)`.

Slider `t` (animation progress): draws curve up to `t = T_slider`. Render velocity vector `(x'(t), y'(t))` as an arrow at current `t` via `<arrowHelper>`.

- [ ] **Step 2: Implement `PolarCurves/index.tsx`**

`mode="2d"`. Renders `r = f(θ)` curve using `polarCurvePoints`. Animate sweep: slider `Θ` controls how much of `[0, 2π]` is drawn. 

Paradigms: cardioid `r = 1 + cos(θ)`, rose `r = cos(nθ)` with slider `n`, spiral `r = aθ`, limaçon `r = a + b·cos(θ)`, custom.

Show polar grid (concentric circles + radial lines) using `<Line>`. Animate sweep with trailing color fade.

- [ ] **Step 3: Implement `PolarAreaArcLength/index.tsx`**

`mode="2d"`. Renders polar curve with animated sector sweep for area. Slider `θ_max`. Shades the swept area. Live display: area formula `A = ½∫r²dθ`, numeric value. Second paradigm: arc length.

- [ ] **Step 4: Implement `ConicSections/index.tsx`**

`mode="2d"`. Renders ellipse, parabola, hyperbola as animated 2D curves. Paradigms with sliders:
- Ellipse: `a`, `b` sliders; show foci as dots; display `c = √(a²-b²)`, eccentricity.
- Parabola: `p` (focus-directrix distance) slider; show focus and directrix.
- Hyperbola: `a`, `b` sliders; show asymptotes as dashed lines, foci.
- Rotation: show how `Ax² + Bxy + Cy² = 1` rotates with angle slider.

- [ ] **Step 5: Implement `ConicsInPolar/index.tsx`**

`mode="2d"`. Renders `r = ed/(1 + e·cos(θ))`. Sliders: `e` (eccentricity), `d` (directrix distance). Animate: as `e` increases past 1, conic transitions ellipse → parabola → hyperbola. Show focus at origin, directrix as dashed line.

- [ ] **Step 6: Verify all Unit 4 topics render**

Visit each URL. Parametric: custom dual-input works. Polar: sweep animation runs. Conics: eccentricity slider morphs the curve.

- [ ] **Step 7: Commit**

```bash
git add components/visualizations/calc2/ParametricCurves/ components/visualizations/calc2/PolarCurves/ components/visualizations/calc2/PolarAreaArcLength/ components/visualizations/calc2/ConicSections/ components/visualizations/calc2/ConicsInPolar/
git commit -m "feat: add Unit 4 Parametric, Polar & Conics visualizations"
```

---

### Task 15: Verification, Polish & PDF Ingestion

**Files:**
- Modify: various (bug fixes only)

---

- [ ] **Step 1: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass. Fix any regressions.

- [ ] **Step 2: Run PDF ingestion**

```bash
PDF_PATH="C:\Users\nikos\Documents\Obsidian\Mathground\Thomas' Calculus - George B. Thomas.pdf" npm run ingest
```

(On Windows, use the path as-is in a PowerShell terminal; on WSL, adapt the path.) Expected: `"Chunked N chunks. Embedding... Done."` with no errors. Verify `./data/vectors/thomas_calculus.lance` directory created.

- [ ] **Step 3: Verify RAG in chat**

Navigate to `/courses/calc2/applications/volumes-disks-washers`. Ask the tutor: "What does Thomas say about the disk method?" Confirm the response references `§6.2` and quotes textbook language.

- [ ] **Step 4: Geometry disposal check**

In browser DevTools Memory tab: take a heap snapshot before and after switching paradigms 10 times on the Volumes of Revolution page. Confirm heap size does not grow unboundedly (< 5MB growth per 10 switches).

- [ ] **Step 5: 60fps check**

On the VolumesRevolution page, enable Chrome DevTools Rendering → Frame rate overlay. Move `n` slider rapidly. Confirm frame rate stays ≥ 50fps.

- [ ] **Step 6: Expression sandbox security check**

In a topic's FunctionInput, enter each of the following — confirm none execute or crash:
- `process.exit(1)` → invalid expression error
- `require('fs')` → invalid expression error
- `1/0` → valid (returns Infinity); geometry clamps gracefully
- `sqrt(-1)` → valid via mathjs (returns NaN); geometry clamps to 0

- [ ] **Step 7: Custom function end-to-end check**

On `/courses/calc2/applications/volumes-disks-washers`, switch to Custom paradigm. Enter `sin(x)`, set `a = 0`, `b = 3.14`. Confirm disk geometry renders for `f(x) = sin(x)` on `[0, π]`.

- [ ] **Step 8: Final commit and push**

```bash
npx vitest run   # must be green
git add -A
git commit -m "chore: verification pass — all tests green, RAG ingested, 60fps confirmed"
git push origin claude/affectionate-cerf-v6xkpo
```

---

*End of plan. 15 tasks; estimated 25–40 hours of implementation. All tasks build linearly on their predecessors; do not skip ahead.*
