# Mathground — Project Handoff

## What This Is

An interactive Calculus II learning platform. Each course topic has a live 3D
visualization (React Three Fiber + Three.js) controlled by parameter sliders, plus
an AI tutor chat panel. Based on Thomas' Calculus 11th Edition.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.4.6 — App Router, Turbopack (default dev mode) |
| UI | React 19.3.1, Tailwind CSS |
| 3D | @react-three/fiber v9.8.2, @react-three/drei v10.7.9, Three.js ^0.170 |
| Math parsing | mathjs (via `lib/math/parser.ts` → `parseExpression`) |
| AI tutor | OpenAI API (chat panel in `components/tutor/`) |
| Vector search | LanceDB + @xenova/transformers (PDF ingestion pipeline in `scripts/`) |
| Testing | Vitest — 24 test files, 188 tests, all green |
| Branch | `claude/affectionate-cerf-v6xkpo` |

---

## Repository Layout

```
app/
  page.tsx                          # Course listing home
  courses/[courseId]/units/[unitId]/topics/[topicId]/
    page.tsx                        # Topic page (server)
    TopicPageClient.tsx             # Layout: 3D canvas + sliders + chat

components/
  units/
    ParadigmVisualization.tsx       # Router: picks the right 3D scene per topic
    unit1/   – 7 application scenes
    unit2/   – 6 technique scenes
    unit3/   – 4 series scenes
    unit4/   – 2 parametric/polar scenes
  tutor/   – AI chat (ChatPanel, MessageBubble, renderLatex)
  ui/      – Sidebar, SliderPanel, TopicBreadcrumb, AITutor wrapper
  visualization/ – shared canvas helpers (AxisLabels, CameraPresets, etc.)

lib/
  courses/
    registry.ts                     # getCourse / getUnit / getTopic helpers
    calc2/
      index.ts                      # Calculus II course object
      units/
        applications.ts             # Unit 1: 8 topics
        techniques.ts               # Unit 2: 7 topics
        series.ts                   # Unit 3: 7 topics
        parametric-polar.ts         # Unit 4: 5 topics
  math/
    parser.ts                       # parseExpression(fn, vars) → { valid, fn }
  store.ts                          # Zustand slider state
  types.ts                          # Course / Unit / Topic / Paradigm types

scripts/
  ingest-pdf.ts                     # PDF → LanceDB embeddings (run with npm run ingest)

tests/                              # Mirrors src structure; mocks Canvas/R3F/THREE
```

---

## How a Topic Works

Each `Topic` in `lib/courses/calc2/units/*.ts` has one or more `Paradigm` objects.
A `Paradigm` carries:

- `visualizationComponent` — string key (e.g. `'VolumesRevolution'`)
- `sliders` — parameter ranges
- `inputs` — optional function input field

`ParadigmVisualization.tsx` reads `paradigm.visualizationComponent`, picks the
matching dynamic-import Scene component (`ssr: false`), and passes slider values
to it. All 3D scenes are client-only; every scene file starts with `'use client'`.

---

## 3D Scenes — What's Built

### Unit 1: Applications of Definite Integrals

| Topic | Scene file | Key visuals |
|---|---|---|
| Areas Between Curves | `AreasBetweenCurvesScene` | Gradient ribbon between f and g, shaded region |
| Volumes (Disks/Washers/Shells) | `VolumesRevolutionScene` | Lathe solids, stacked disk slices, transparent shell cylinders |
| Surface of Revolution | `SurfaceRevolutionScene` | Tube swept around axis |
| Arc Length | `ArcLengthScene` | Inscribed polygon segments converging to curve |
| Work | `WorkScene` | Spring helix + force bars / chain lifting with colored segments |
| Centers of Mass | `CentersOfMassScene` | Gradient mesh under f(x) + centroid sphere + crosshairs |
| Fluid Pressure | `FluidPressureScene` | Pressure-gradient plate mesh + triangular wedge of force bars |

### Unit 2: Techniques of Integration

| Topic | Scene file | Key visuals |
|---|---|---|
| Integration by Parts | `IntegrationByPartsScene` | u·dv rectangle decomposition |
| Partial Fractions | `PartialFractionsScene` | Decomposed component curves |
| Trig Integrals | `TrigIntegralsScene` | Integrand "crown" above the unit circle |
| Trig Substitution | `TrigSubstitutionScene` | Right triangle + substitution geometry |
| Numerical Integration | `NumericalIntegrationScene` | Riemann bars / trapezoids / Simpson parabolas |
| Improper Integrals | `ImproperIntegralsScene` | Infinite tail with convergence indicator |

### Unit 3: Infinite Sequences & Series

| Topic | Scene file | Key visuals |
|---|---|---|
| Sequences | `SequenceScene` | Scatter plot with convergence line |
| Infinite Series / Convergence Tests / Alternating | `PartialSumsScene` | Staircase partial-sum bars |
| Taylor & Maclaurin / Power Series | `TaylorSeriesScene` | Polynomial approximation overlaid on target function |
| Fourier Series | `FourierSeriesScene` | Harmonics stacked into square/sawtooth wave |

### Unit 4: Parametric & Polar

| Topic | Scene file | Key visuals |
|---|---|---|
| Parametric Curves | `ParametricCurveScene` | Traced curve with dot, velocity vector |
| Polar Curves / Area & Arc / Conics | `PolarCurveScene` | Polar grid, swept radial curve |
| Conic Sections | `ParametricCurveScene` (reused) | Ellipse / parabola / hyperbola |
| Conics in Polar | `PolarCurveScene` (reused) | r = ed/(1+e·cosθ) |

**Coverage: 100% — no "coming soon" fallback is ever reached.**

---

## Running Locally

```bash
git clone https://github.com/nikosvil/Mathground.git
cd Mathground
git checkout claude/affectionate-cerf-v6xkpo
npm install
npm run dev
# → http://localhost:3000
```

Tests:
```bash
npm test
```

---

## Known Issues / Warnings (non-fatal)

- `Attempted to synchronously unmount a root while React was already rendering` —
  React 19 + R3F v9 race on rapid navigation; cosmetic, no crash.
- Lowercase JSX warnings in tests (`<ambientLight />` etc.) — expected; R3F custom
  elements don't go through normal React component resolution in jsdom.
- MetaMask extension noise in browser console — unrelated to the app.

---

## What's Left / Ideas for Next Work

### High priority
- **Merge branch to main** — the dev branch `claude/affectionate-cerf-v6xkpo` has
  never been merged. All 3D work lives there.
- **Verify 3D scenes look correct** — the user has only just gotten the dev server
  running. Each scene should be visually reviewed.

### Feature additions
- **More courses** — the registry is wired for multiple courses. Calc I, Calc III,
  or Linear Algebra could be added with new `lib/courses/` entries and scenes.
- **Exercise system** — no problem sets or grading exist yet.
- **User accounts** — no auth layer; everything is stateless per session.
- **AI tutor improvements** — currently uses OpenAI; could integrate course-aware
  context using the LanceDB embeddings from the PDF ingest pipeline.
- **Animation** — scenes are static (sliders only); `useFrame` could add time-driven
  animation (e.g. tracing parametric curves, animating partial sum convergence).

### Tech debt
- `FunctionPlot2D` is imported in `ParadigmVisualization.tsx` but never used —
  should be removed.
- `components/visualizations/shared/` — unclear if still referenced; audit and clean
  up if not.
- Vitest mocks for THREE (`BufferGeometry`, `Float32BufferAttribute`) are repeated
  in every test file; could be extracted to a shared setup file.

---

## Attribution Rules (every commit and PR)

**Commit messages must end with:**
```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YBCM31ocFCQVBvSk4dJBcM
```

**PR descriptions must end with:**
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01YBCM31ocFCQVBvSk4dJBcM
```

---

## Important Architectural Notes

1. **Dynamic imports with `ssr: false`** — every Scene is loaded via
   `next/dynamic(..., { ssr: false })` in `ParadigmVisualization.tsx`. Never render
   a Canvas or useThree hook outside a client component; server rendering Three.js
   breaks.

2. **AGENTS.md** — Next.js 16 has breaking changes from earlier versions. Before
   touching any Next.js config or APIs, read
   `node_modules/next/dist/docs/` for the current behaviour.

3. **React 19 / R3F v9** — Next.js 16 resolves `react` to 19.x even if `package.json`
   says `^18`. R3F v8 crashes (`ReactSharedInternals is undefined`); always use
   R3F v9+. Do not add `@react-three/fiber` or `@react-three/drei` to
   `transpilePackages` — it causes a THREE.js dual-instance and breaks buffer
   attribute methods.

4. **`parseExpression`** — in `lib/math/parser.ts`. Takes a string and variable
   list, returns `{ valid: boolean, fn: (vars) => number | null }`. Use this for
   all user-entered functions; it handles mathjs syntax (`sin`, `^`, `sqrt`, etc.).

5. **`integrate(f, a, b, steps=800)`** — midpoint-rule helper inside each scene
   that needs it. Not shared; copy the pattern. Guards against non-finite values.
