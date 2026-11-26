import type { Unit } from '@/lib/types'

export const parametricPolarUnit: Unit = {
  id: 'parametric-polar',
  title: 'Parametric Equations & Polar Coordinates',
  thomasChapters: [10],
  topics: [
    {
      id: 'parametric-curves',
      title: 'Parametric Curves',
      thomasSection: '§10.4',
      thomasPageStart: 598,
      defaultParadigm: 'cycloid',
      paradigms: [
        {
          id: 'cycloid',
          title: 'Cycloid',
          description: 'x = t − sin(t), y = 1 − cos(t)',
          visualizationComponent: 'ParametricCurves',
          inputs: { type: 'parametric', variables: ['t'], labels: ['x(t)', 'y(t)'] },
          sliders: [
            { id: 'T', label: 'T (trace to)', min: 0, max: 12.57, step: 0.1, default: 6.28 },
          ],
        },
        {
          id: 'circle',
          title: 'Circle',
          description: 'x = cos(t), y = sin(t)',
          visualizationComponent: 'ParametricCurves',
          inputs: { type: 'parametric', variables: ['t'], labels: ['x(t)', 'y(t)'] },
          sliders: [
            { id: 'T', label: 't (animate)', min: 0, max: 6.28, step: 0.05, default: 3.14 },
            { id: 'r', label: 'r', min: 0.5, max: 3, step: 0.1, default: 1 },
          ],
        },
        {
          id: 'lissajous',
          title: 'Lissajous',
          description: 'x = sin(at), y = sin(bt)',
          visualizationComponent: 'ParametricCurves',
          inputs: { type: 'parametric', variables: ['t'], labels: ['x(t)', 'y(t)'] },
          sliders: [
            { id: 'a', label: 'a', min: 1, max: 5, step: 1, default: 2 },
            { id: 'b', label: 'b', min: 1, max: 5, step: 1, default: 3 },
          ],
        },
        {
          id: 'custom',
          title: 'Custom x(t), y(t)',
          description: 'Enter your own parametric equations',
          visualizationComponent: 'ParametricCurves',
          inputs: { type: 'parametric', variables: ['t'], labels: ['x(t)', 'y(t)'] },
          sliders: [
            { id: 'tMin', label: 't min', min: -6.28, max: 0, step: 0.1, default: 0 },
            { id: 'tMax', label: 't max', min: 0, max: 12.57, step: 0.1, default: 6.28 },
          ],
        },
      ],
    },
    {
      id: 'polar-coordinates',
      title: 'Polar Coordinates',
      thomasSection: '§10.5–10.6',
      thomasPageStart: 607,
      defaultParadigm: 'cardioid',
      paradigms: [
        {
          id: 'cardioid',
          title: 'Cardioid',
          description: 'r = 1 + cos(θ)',
          visualizationComponent: 'PolarCurves',
          inputs: { type: 'single', variable: 'θ', label: 'r(θ)' },
          sliders: [
            { id: 'Theta', label: 'θ max', min: 0, max: 6.28, step: 0.05, default: 6.28 },
          ],
        },
        {
          id: 'rose',
          title: 'Rose Curve',
          description: 'r = cos(nθ)',
          visualizationComponent: 'PolarCurves',
          inputs: { type: 'single', variable: 'θ', label: 'r(θ)' },
          sliders: [
            { id: 'n', label: 'n (petals)', min: 1, max: 8, step: 1, default: 3 },
            { id: 'Theta', label: 'θ max', min: 0, max: 6.28, step: 0.05, default: 6.28 },
          ],
        },
        {
          id: 'spiral',
          title: 'Archimedean Spiral',
          description: 'r = aθ',
          visualizationComponent: 'PolarCurves',
          inputs: { type: 'single', variable: 'θ', label: 'r(θ)' },
          sliders: [
            { id: 'a', label: 'a', min: 0.1, max: 1, step: 0.05, default: 0.3 },
            { id: 'Theta', label: 'θ max', min: 0, max: 18.85, step: 0.1, default: 12.57 },
          ],
        },
        {
          id: 'limacon',
          title: 'Limaçon',
          description: 'r = a + b·cos(θ)',
          visualizationComponent: 'PolarCurves',
          inputs: { type: 'single', variable: 'θ', label: 'r(θ)' },
          sliders: [
            { id: 'a', label: 'a', min: 0.5, max: 3, step: 0.1, default: 1 },
            { id: 'b', label: 'b', min: 0.5, max: 3, step: 0.1, default: 1 },
          ],
        },
        {
          id: 'custom',
          title: 'Custom r(θ)',
          description: 'Enter your own polar curve',
          visualizationComponent: 'PolarCurves',
          inputs: { type: 'single', variable: 'θ', label: 'r(θ)' },
          sliders: [
            { id: 'Theta', label: 'θ max', min: 0, max: 12.57, step: 0.1, default: 6.28 },
          ],
        },
      ],
    },
    {
      id: 'polar-area-arc-length',
      title: 'Area & Arc Length in Polar',
      thomasSection: '§10.7',
      thomasPageStart: 614,
      defaultParadigm: 'area-sweep',
      paradigms: [
        {
          id: 'area-sweep',
          title: 'Area Sweep',
          description: 'A = ½∫r²dθ animated sector sweep',
          visualizationComponent: 'PolarAreaArcLength',
          inputs: { type: 'single', variable: 'θ', label: 'r(θ)' },
          sliders: [
            { id: 'Theta', label: 'θ max', min: 0, max: 6.28, step: 0.05, default: 3.14 },
          ],
        },
        {
          id: 'arc-length',
          title: 'Arc Length',
          description: 'L = ∫√(r²+(dr/dθ)²)dθ',
          visualizationComponent: 'PolarAreaArcLength',
          inputs: { type: 'single', variable: 'θ', label: 'r(θ)' },
          sliders: [
            { id: 'Theta', label: 'θ max', min: 0, max: 6.28, step: 0.05, default: 6.28 },
            { id: 'n', label: 'n (segments)', min: 4, max: 100, step: 4, default: 20 },
          ],
        },
      ],
    },
    {
      id: 'conic-sections',
      title: 'Conic Sections',
      thomasSection: '§10.1–10.3',
      thomasPageStart: 574,
      defaultParadigm: 'ellipse',
      paradigms: [
        {
          id: 'ellipse',
          title: 'Ellipse',
          description: 'x²/a² + y²/b² = 1 with foci',
          visualizationComponent: 'ConicSections',
          inputs: { type: 'single', variable: 'x', label: 'f(x)' },
          sliders: [
            { id: 'a', label: 'a (semi-major)', min: 1, max: 5, step: 0.1, default: 3 },
            { id: 'b', label: 'b (semi-minor)', min: 0.5, max: 4, step: 0.1, default: 2 },
          ],
        },
        {
          id: 'parabola',
          title: 'Parabola',
          description: 'y² = 4px with focus and directrix',
          visualizationComponent: 'ConicSections',
          inputs: { type: 'single', variable: 'x', label: 'f(x)' },
          sliders: [
            { id: 'p', label: 'p (focus dist.)', min: 0.5, max: 4, step: 0.1, default: 1 },
          ],
        },
        {
          id: 'hyperbola',
          title: 'Hyperbola',
          description: 'x²/a² − y²/b² = 1 with asymptotes',
          visualizationComponent: 'ConicSections',
          inputs: { type: 'single', variable: 'x', label: 'f(x)' },
          sliders: [
            { id: 'a', label: 'a', min: 0.5, max: 4, step: 0.1, default: 2 },
            { id: 'b', label: 'b', min: 0.5, max: 4, step: 0.1, default: 1 },
          ],
        },
        {
          id: 'rotation',
          title: 'Rotated Conic',
          description: 'Ax² + Bxy + Cy² = 1 rotation angle',
          visualizationComponent: 'ConicSections',
          inputs: { type: 'single', variable: 'x', label: 'f(x)' },
          sliders: [
            { id: 'angle', label: 'θ (rotation)', min: 0, max: 1.57, step: 0.05, default: 0.5 },
            { id: 'a', label: 'a', min: 0.5, max: 3, step: 0.1, default: 2 },
            { id: 'b', label: 'b', min: 0.5, max: 3, step: 0.1, default: 1 },
          ],
        },
      ],
    },
    {
      id: 'conics-in-polar',
      title: 'Conics in Polar Coordinates',
      thomasSection: '§10.8',
      thomasPageStart: 622,
      defaultParadigm: 'eccentricity',
      paradigms: [
        {
          id: 'eccentricity',
          title: 'Eccentricity Morph',
          description: 'r = ed/(1+e·cos θ): ellipse→parabola→hyperbola',
          visualizationComponent: 'ConicsInPolar',
          inputs: { type: 'single', variable: 'θ', label: 'r(θ)' },
          sliders: [
            { id: 'e', label: 'e (eccentricity)', min: 0.1, max: 2, step: 0.05, default: 0.5 },
            { id: 'd', label: 'd (directrix)', min: 0.5, max: 5, step: 0.1, default: 2 },
          ],
        },
        {
          id: 'focus-directrix',
          title: 'Focus-Directrix',
          description: 'Show focus at origin and directrix line',
          visualizationComponent: 'ConicsInPolar',
          inputs: { type: 'single', variable: 'θ', label: 'r(θ)' },
          sliders: [
            { id: 'e', label: 'e', min: 0.1, max: 1.5, step: 0.05, default: 0.8 },
            { id: 'd', label: 'd', min: 0.5, max: 4, step: 0.1, default: 1 },
          ],
        },
      ],
    },
  ],
}
