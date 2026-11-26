# Mathground — University Mathematics Visualization & AI Tutoring Platform
## Design Document — Phase 1: Calculus II

---

## Intent & Why

University students learning Calculus II struggle with spatial/conceptual intuition that static textbook figures cannot provide. Mathground's core thesis is that **beginner-friendly, high-craft interactive visualizations paired with a context-aware AI tutor dramatically lower the barrier to understanding**. The platform grounds every concept in a specific textbook (Thomas' Calculus, 11th Ed.) through a RAG pipeline so the AI tutor cites the exact theorems, definitions, and worked examples the student's course uses.

Phase 1 delivers the complete core platform plus a fully-implemented Calculus II curriculum. Architecture is designed so adding future courses (Calc I, Linear Algebra, Multivariable Calculus, Differential Equations) requires only new course modules — not rewriting core logic.

---

## Goals

- Rich, polished, beginner-accessible 3D/2D interactive visualizations for all major Calculus II topics
- 3–5 curated visual paradigms per topic plus a custom function sandbox
- Step-by-step visual walkthroughs within each paradigm
- DeepSeek-powered AI tutor with context injection (active topic, paradigm, slider state, RAG chunks from Thomas)
- SSE streaming with KaTeX-rendered LaTeX in the chat UI
- PDF ingestion + local semantic RAG pipeline over Thomas' Calculus 11E
- No login wall for the MVP; auth-ready data layer (session IDs on all API calls)
- Modular course registry — adding a course adds a module, not core rewrites

## Non-Goals (Phase 1)

- User accounts, authentication, persisted progress
- Mobile layout (responsive desktop is sufficient)
- Deployment configuration (Vercel, Docker, etc.)
- Calculus I, Linear Algebra, Multivariable Calculus, Differential Equations
- Quiz or assessment system
- Video content

## Anti-Goals

- Server-side rendering of Three.js/R3F scenes (causes hydration errors; all canvases are `ssr: false`)
- Exposing DEEPSEEK_API_KEY to the browser
- Using eval() or any unsafe math expression execution on the client

---

## Constraints

- API key (DeepSeek) must remain server-side only; never bundled to the client
- All math expression parsing must be sandboxed (mathjs `evaluate` with limited scope)
- R3F components must dynamically import with `{ ssr: false }` or be wrapped in a client boundary with `useEffect` guards
- LanceDB persists vector data to disk under `/data/vectors/` (gitignored)
- Embedding model runs locally in Node.js — no external embedding API key required
- Thomas' Calculus PDF is 1,572 pages; ingestion runs once at dev-time via CLI script, not on every cold start

---

## Approaches Considered

### A — Next.js 15 App Router Monorepo ✅ **CHOSEN**

Single repo. App Router pages for the frontend; Route Handlers for all backend work (SSE, RAG, PDF ingestion). R3F runs in `"use client"` components, dynamically imported. DeepSeek key lives in `.env.local`.

**Why chosen:** No CORS, no two-process dev, SSE via Route Handlers is production-ready, single deployment unit, server/client boundary with Three.js is a well-documented pattern (`dynamic(() => import(...), { ssr: false })`).

### B — Vite React SPA + Express API Server

Separate `client/` and `server/` processes. Express handles SSE and RAG.

**Why rejected:** Two processes to run, CORS config required, more complex deployment — no meaningful benefit for this project.

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) |
| 3D Visualizations | @react-three/fiber, @react-three/drei, three.js |
| Math Parsing | mathjs (client-side, sandboxed) |
| LaTeX Rendering | KaTeX |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| AI Backend | DeepSeek API via openai SDK (deepseek-chat / deepseek-reasoner) |
| Streaming | SSE via Next.js Route Handler ReadableStream |
| Embeddings | @xenova/transformers (all-MiniLM-L6-v2, runs in Node.js) |
| Vector Store | LanceDB (zero-config, embeds in Node.js, persists to disk) |
| PDF Parsing | pdf-parse |
| Animation | Framer Motion (UI), R3F useFrame (canvas) |

### Folder Structure

```
/mathground
  /app
    layout.tsx                        ← root layout (providers, font, theme)
    page.tsx                          ← landing / course selection
    /courses
      /[courseId]
        page.tsx                      ← course overview
        /[unit]
          /[topic]
            page.tsx                  ← split-screen topic page
    /api
      /chat
        route.ts                      ← SSE stream: DeepSeek + RAG context injection
      /ingest
        route.ts                      ← dev-only: PDF ingestion trigger
      /retrieve
        route.ts                      ← debug: expose retrieved RAG chunks

  /components
    /visualizations
      /calc2
        /VolumesRevolution/           ← disk, washer, shell, shifted-axis paradigms
        /TaylorSeries/                ← degree-N polynomial convergence
        /PolarCurves/                 ← r=f(θ) sweep animation
        /ParametricCurves/            ← velocity/tangent vectors
        /TrigSubstitution/            ← right-triangle visualizer
        /ImproperIntegrals/           ← asymptotic area convergence/divergence
        /SeriesConvergence/           ← partial sum stair-step
      /shared
        MathCanvas.tsx                ← base R3F canvas (lights, OrbitControls, grid, axes)
        AxisLabels.tsx                ← 3D axis tick labels via Html
        StepController.tsx            ← step-through state machine
        CameraPresets.tsx             ← 3D Perspective / Side Profile / Top View buttons
        ResetCamera.tsx
    /ui
      /AITutor
        ChatPanel.tsx                 ← SSE consumer, message list
        MessageBubble.tsx             ← KaTeX rendering of LaTeX in responses
        ThinkingToggle.tsx            ← switch deepseek-chat ↔ deepseek-reasoner
      FunctionInput.tsx               ← mathjs-validated expression text input
      ParadigmSelector.tsx            ← paradigm tabs/cards per topic
      LatexDisplay.tsx                ← KaTeX inline/block renderer
      SliderPanel.tsx                 ← synchronized slider + live formula readout

  /lib
    /rag
      ingest.ts                       ← PDF → chunks → embeddings → LanceDB upsert
      retrieve.ts                     ← query → embed → LanceDB ANN search → top-k chunks
      chunker.ts                      ← section-aware chunking (500-token target, section boundaries)
    /math
      parser.ts                       ← mathjs sandboxed evaluate + validation
      /geometry
        revolution.ts                 ← Disk/washer/shell Three.js BufferGeometry generators
        series.ts                     ← Taylor polynomial point generation
        polar.ts                      ← Polar curve r=f(θ) point generation
        parametric.ts                 ← Parametric curve point generation
    /ai
      deepseek.ts                     ← OpenAI SDK client, SSE stream wrapper
      prompts.ts                      ← System prompt templates with context injection
    /courses
      registry.ts                     ← Course/Unit/Topic interfaces + registry lookup
      /calc2
        index.ts                      ← Calculus II course definition
        units.ts                      ← Unit/topic list with Thomas chapter/section refs

  /scripts
    ingest-pdf.ts                     ← Standalone Node.js CLI: run once to index Thomas PDF

  /data
    /vectors                          ← LanceDB persisted tables (gitignored)

  /public
    /textures                         ← Any Three.js texture assets

  .env.local                          ← DEEPSEEK_API_KEY, PDF_PATH
  next.config.ts
  tailwind.config.ts
  tsconfig.json
```

---

## Course Registry Schema

```typescript
interface Course {
  id: string                 // 'calc2'
  title: string              // 'Calculus II'
  description: string
  units: Unit[]
}

interface Unit {
  id: string                 // 'applications-definite-integrals'
  title: string
  thomasChapters: number[]   // [6]
  topics: Topic[]
}

interface Topic {
  id: string                 // 'volumes-revolution'
  title: string
  thomasSection: string      // '6.2–6.3'
  thomasPageStart: number    // approximate page in Thomas 11E
  paradigms: Paradigm[]
  defaultParadigm: string    // paradigm id
}

interface Paradigm {
  id: string
  label: string
  description: string
  visualizationComponent: string   // component name, dynamically imported
  defaultSliders: SliderConfig[]
}

interface SliderConfig {
  id: string
  label: string              // LaTeX string
  min: number
  max: number
  step: number
  default: number
}
```

---

## Calculus II Curriculum (Thomas 11E Mapping)

### Unit 1 — Applications of Definite Integrals (Ch. 6)
| Topic | Thomas Section | Key Paradigms |
|-------|---------------|---------------|
| Areas Between Curves | 6.1 | Same-axis two functions; horizontal slicing; signed area |
| Volumes by Disks & Washers | 6.2 | Disk around x-axis; washer with inner/outer; shifted axis y=k |
| Volumes by Cylindrical Shells | 6.3 | Shell around y-axis; shell around x=k |
| Arc Length | 6.4 | Smooth curve arc length with approximating segments animation |
| Areas of Surfaces of Revolution | 6.5 | Surface area bands visualization |

### Unit 2 — Techniques of Integration (Ch. 8)
| Topic | Thomas Section | Key Paradigms |
|-------|---------------|---------------|
| Integration by Parts | 8.2 | Tabular method; uv - ∫v du animation |
| Trigonometric Integrals | 8.3 | sin^m cos^n strategies |
| Trigonometric Substitution | 8.4 | Right-triangle visualizer (√(a²-x²), √(a²+x²), √(x²-a²)) |
| Partial Fractions | 8.5 | Decomposition steps with pole visualization |
| Improper Integrals | 8.8 | Infinite upper bound; vertical asymptote; convergence vs. divergence |

### Unit 3 — Infinite Sequences & Series (Ch. 11)
| Topic | Thomas Section | Key Paradigms |
|-------|---------------|---------------|
| Sequences | 11.1 | Convergence plot; monotone/bounded visualization |
| Series & Partial Sums | 11.2 | Stair-step partial sum animation; geometric series |
| Convergence Tests | 11.3–11.6 | Integral test area comparison; ratio test visualization |
| Taylor & Maclaurin Series | 11.9–11.10 | Degree-N polynomial slider; local-to-global convergence; error bound |
| Power Series | 11.7–11.8 | Radius of convergence animation |

### Unit 4 — Parametric Equations & Polar Coordinates (Ch. 10)
| Topic | Thomas Section | Key Paradigms |
|-------|---------------|---------------|
| Parametric Curves | 10.4 | Cycloid; custom x(t), y(t); velocity tangent vector animation |
| Polar Coordinates | 10.5–10.6 | r=f(θ) sweep animation; petal curves; spirals |
| Area in Polar | 10.7 | Sector sweep area animation |
| Arc Length in Polar | 10.7 | Polar arc length integration |

---

## RAG Pipeline

### Ingestion (run once via `scripts/ingest-pdf.ts`)

1. `pdf-parse` extracts full text from Thomas' Calculus 11E PDF (1,572 pages)
2. `chunker.ts` splits text into ~500-token chunks, respecting section boundaries (heuristic: detect "Section X.Y", "THEOREM", "DEFINITION", "EXAMPLE" markers)
3. Each chunk tagged with metadata: `{ source: "Thomas' Calculus 11E", chapter: number, section: string, pageStart: number, chunkType: "body"|"theorem"|"definition"|"example" }`
4. `@xenova/transformers` (all-MiniLM-L6-v2 model) embeds each chunk as a 384-dim float32 vector — runs fully in Node.js, no API key
5. Embeddings + metadata upserted to LanceDB table `thomas_calculus` under `/data/vectors/`
6. Total estimated time: ~15–30 minutes on first run; subsequent runs are skipped if table exists

### Retrieval (per chat message)

1. Active topic's Thomas section + user's message → embed query with same model
2. LanceDB ANN search, top-5 chunks filtered by chapter relevance (prefer current chapter, fallback to full corpus)
3. Chunks formatted as: `[§6.2, p.342] "The disk method formula is V = π∫ₐᵇ [R(x)]² dx..."`
4. Injected into DeepSeek system prompt under `## Textbook Context`

---

## AI Tutor (DeepSeek Integration)

### Endpoint: `POST /api/chat` → SSE stream

**Request body:**
```typescript
{
  messages: { role: "user"|"assistant", content: string }[]
  context: {
    courseId: string
    unitId: string
    topicId: string
    paradigmId: string
    sliderValues: Record<string, number>
    customFunction?: string
    sessionId: string        // uuid from sessionStorage — stored but not enforced
  }
  mode: "chat" | "reasoning"   // "reasoning" uses deepseek-reasoner
}
```

**Server-side assembly:**
1. Retrieve top-5 RAG chunks for topic + user query
2. Build system prompt: topic context + visualization state + textbook chunks + persona instruction
3. Call DeepSeek API (openai SDK) with `stream: true`
4. Pipe SSE chunks: `data: {"delta": "...", "type": "content"}\n\n`
5. On stream end: `data: {"type": "done"}\n\n`

**System prompt structure:**
```
You are a friendly, rigorous Calculus II tutor. The student is currently viewing an interactive 3D visualization of [TOPIC] in [PARADIGM_LABEL] mode.

## Current Visualization State
- Topic: [topic title]
- Paradigm: [paradigm label]
- Sliders: n = 20, a = 0, b = π
- Custom function: sin(x)

## Textbook Context (Thomas' Calculus 11E)
[§6.2, p.342] "..."
[§6.2, p.344] "..."

## Instructions
Explain concepts intuitively first (geometric/visual intuition before algebra). Reference the 3D visualization on screen. Guide step-by-step. Use LaTeX for all math. For quick questions use deepseek-chat; for multi-step derivations switch to deepseek-reasoner.
```

**Client-side SSE consumer:**
- `EventSource` / `fetch` with `ReadableStream`
- Accumulates delta chunks, renders via KaTeX `renderToString` on each update
- Detects `$$...$$` and `$...$` delimiters; re-renders incrementally

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Navbar: Mathground | Courses > Calculus II > Volumes           │
├──────────────────────────────────┬──────────────────────────────┤
│  3D CANVAS (60%)                 │  RIGHT PANEL (40%)           │
│  ┌────────────────────────────┐  │  ┌──────────────────────┐    │
│  │  R3F Scene                 │  │  │  Paradigm Selector   │    │
│  │  (OrbitControls, lights,   │  │  │  ○ Disk  ○ Washer    │    │
│  │   grid, axis labels)       │  │  │  ● Shell ○ Shifted   │    │
│  │                            │  │  └──────────────────────┘    │
│  │                            │  │  ┌──────────────────────┐    │
│  │                            │  │  │  Step Controller     │    │
│  │                            │  │  │  ◀ Step 1/3: Slice ▶│    │
│  │                            │  │  └──────────────────────┘    │
│  └────────────────────────────┘  │  ┌──────────────────────┐    │
│  ┌──────────────────────────┐    │  │  Sliders             │    │
│  │  Camera: [3D] [Side] [Top]│    │  │  n: ━━●━━━ 20       │    │
│  │  [Reset Camera]           │    │  │  a: ━●━━━━ 0        │    │
│  └──────────────────────────┘    │  │  b: ━━━━●━ π        │    │
│                                  │  └──────────────────────┘    │
│                                  │  ┌──────────────────────┐    │
│                                  │  │  Live Formula        │    │
│                                  │  │  V = π∫₀^π sin²x dx │    │
│                                  │  │  ≈ 4.935             │    │
│                                  │  └──────────────────────┘    │
│                                  │  ┌──────────────────────┐    │
│                                  │  │  Custom Function     │    │
│                                  │  │  f(x): [sin(x)____]  │    │
│                                  │  └──────────────────────┘    │
├──────────────────────────────────┴──────────────────────────────┤
│  AI TUTOR PANEL (collapsible)                                    │
│  [deepseek-chat ⟷ deepseek-reasoner toggle]                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Chat history with KaTeX-rendered LaTeX                    │ │
│  │  [Type a question...                              ▶ Send]  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Zustand Store Shape

```typescript
interface MathgroundStore {
  // Navigation
  activeCourseId: string | null
  activeUnitId: string | null
  activeTopicId: string | null
  activeParadigmId: string | null

  // Visualization state
  sliderValues: Record<string, number>
  customFunction: string
  currentStep: number
  totalSteps: number
  isAnimating: boolean

  // Camera
  cameraPreset: '3d' | 'side' | 'top'

  // AI Tutor
  chatHistory: ChatMessage[]
  isTutorOpen: boolean
  tutorMode: 'chat' | 'reasoning'
  isStreaming: boolean

  // Session (auth-ready)
  sessionId: string   // uuid, persisted to sessionStorage
}
```

---

## Visualization Engine — Key Patterns

### Base Canvas (`MathCanvas.tsx`)
```typescript
// All topic visualizations wrap this
<Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
  <ambientLight intensity={0.4} />
  <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
  <Grid args={[20, 20]} cellColor="#444" sectionColor="#666" />
  <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
  <AxisLabels />
  {children}
</Canvas>
```

### Dynamic Import Pattern (all visualization pages)
```typescript
const VolumesRevolutionScene = dynamic(
  () => import('@/components/visualizations/calc2/VolumesRevolution'),
  { ssr: false, loading: () => <CanvasLoadingSpinner /> }
)
```

### Geometry Disposal on Unmount
Every R3F component that creates geometry/material must:
```typescript
useEffect(() => {
  return () => {
    geometry.dispose()
    material.dispose()
  }
}, [geometry, material])
```

---

## Security & Safety

| Risk | Mitigation |
|------|-----------|
| Math expression injection | mathjs `evaluate` with limited scope (no `import`, no `require`, no globals) |
| DeepSeek key exposure | Key only in `.env.local`, accessed only in Route Handlers |
| Prompt injection via user messages | System prompt prepended server-side, user content treated as untrusted |
| PDF path traversal | PDF_PATH fixed in env, ingest route dev-only (NODE_ENV check) |

---

## Settled Design Calls (made during review; check while reading)

**Q: Where is the Thomas PDF at dev time?**
→ User's copy lives at `C:\Users\nikos\Documents\Obsidian\Mathground\Thomas' Calculus - George B. Thomas.pdf`. `PDF_PATH` in `.env.local` points there. The ingest script reads from that path; for CI/cloud environments the PDF must be manually placed and `PDF_PATH` updated. The PDF is never committed to the repo.

**Q: How should `deepseek-reasoner` thinking tokens be displayed?**
→ Builder's call: **collapsible "Thinking…" block** above the final answer. The SSE wire format adds `{"type": "thinking", "delta": "..."}` chunks in addition to `{"type": "content", "delta": "..."}`. `MessageBubble` renders a `<details>` block for thinking content. This is the most educationally appropriate choice for a learning platform — seeing the tutor's reasoning process models good mathematical thinking. `ThinkingToggle` controls `tutorMode: 'chat' | 'reasoning'` in the Zustand store.

**Q: How does custom function input work for parametric curves (x(t) and y(t))?**
→ Builder's call: topics declare a `customInputSchema` in their `Paradigm` definition — either `{ type: 'single', variable: 'x' }` or `{ type: 'parametric', variables: ['t'] }`. Parametric paradigms render two `FunctionInput` components side by side (x(t) and y(t)). The Zustand store holds `customFunction: string` for single-input topics and uses `customFunctionX` / `customFunctionY` for parametric. The math parser is called twice for parametric paradigms.

**Q: Should `@xenova/transformers` model weights be pre-downloaded or fetched at runtime?**
→ Builder's call: **runtime download** from HuggingFace Hub on first use (~90MB, one-time). `env.cacheDir` is set to `./data/model-cache` (gitignored). Developer setup instructions warn about first-run latency (~30s). This keeps the repo clean and avoids committing 90MB of binary files.

**Q: Should 2D topics (series stair-step, convergence tests) use R3F or a separate 2D renderer?**
→ Builder's call: **R3F with `mode: '2d' | '3d'` prop on `MathCanvas`**. In `'2d'` mode: orthographic camera, camera preset buttons hidden, OrbitControls locked to pan/zoom only (no rotation). This keeps a single visual system with consistent lighting/antialiasing. No second renderer to maintain.

---

## Builder's Calls (Left to Implementer)

- Exact Three.js geometry construction for each paradigm (disk mesh resolution, transparency values, color palette)
- KaTeX incremental rendering strategy (re-render on each SSE chunk vs. throttled at 60ms)
- Exact Tailwind class choices for dark/light theme
- LanceDB table schema field names
- Specific slider ranges per paradigm (e.g., n ∈ [2, 100] for Riemann-style slice count)
- Error boundary UI for invalid custom function inputs
- Loading skeleton design for the canvas
