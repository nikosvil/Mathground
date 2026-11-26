import type { Unit } from '@/lib/types'

export const techniquesUnit: Unit = {
  id: 'techniques',
  title: 'Techniques of Integration',
  thomasChapters: [8],
  topics: [
    {
      id: 'basic-formulas',
      title: 'Basic Integration Formulas',
      thomasSection: '§8.1',
      thomasPageStart: 490,
      defaultParadigm: 'gallery',
      paradigms: [
        {
          id: 'gallery',
          label: 'Formula Gallery',
          description: 'Visual derivations of standard integral forms',
          visualizationComponent: 'TrigIntegrals',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'a', label: 'a', min: 0, max: 3, step: 0.1, default: 0 },
            { id: 'b', label: 'b', min: 0.5, max: 7, step: 0.1, default: 3.14 },
          ],
        },
      ],
    },
    {
      id: 'integration-by-parts',
      title: 'Integration by Parts',
      thomasSection: '§8.2',
      thomasPageStart: 495,
      defaultParadigm: 'geometric',
      paradigms: [
        {
          id: 'geometric',
          label: 'Geometric View',
          description: 'Rectangle area decomposition: uv = ∫u dv + ∫v du',
          visualizationComponent: 'IntegrationByParts',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'a', label: 'a', min: 0, max: 2, step: 0.1, default: 0 },
            { id: 'b', label: 'b', min: 1, max: 5, step: 0.1, default: 2 },
          ],
        },
        {
          id: 'tabular',
          label: 'Tabular Method',
          description: 'Animated tabular integration by parts',
          visualizationComponent: 'IntegrationByParts',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'steps', label: 'Steps', min: 1, max: 5, step: 1, default: 3 },
          ],
        },
      ],
    },
    {
      id: 'partial-fractions',
      title: 'Partial Fractions',
      thomasSection: '§8.3',
      thomasPageStart: 503,
      defaultParadigm: 'distinct-roots',
      paradigms: [
        {
          id: 'distinct-roots',
          label: 'Distinct Roots',
          description: 'Decompose 1/((x-a)(x-b)) into partial fractions',
          visualizationComponent: 'PartialFractions',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'a', label: 'root a', min: -5, max: 0, step: 0.5, default: -2 },
            { id: 'b', label: 'root b', min: 0, max: 5, step: 0.5, default: 3 },
          ],
        },
        {
          id: 'repeated-root',
          label: 'Repeated Root',
          description: 'Handle (x-a)² in denominator',
          visualizationComponent: 'PartialFractions',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'a', label: 'root a', min: -3, max: 3, step: 0.5, default: 1 },
          ],
        },
        {
          id: 'irreducible-quadratic',
          label: 'Irreducible Quadratic',
          description: 'Handle ax²+bx+c (no real roots) in denominator',
          visualizationComponent: 'PartialFractions',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'a', label: 'a', min: 1, max: 5, step: 0.5, default: 1 },
            { id: 'b', label: 'b', min: 0, max: 3, step: 0.5, default: 0 },
            { id: 'c', label: 'c', min: 1, max: 5, step: 0.5, default: 1 },
          ],
        },
      ],
    },
    {
      id: 'trig-integrals',
      title: 'Trigonometric Integrals',
      thomasSection: '§8.4',
      thomasPageStart: 512,
      defaultParadigm: 'sin-cos',
      paradigms: [
        {
          id: 'sin-cos',
          label: 'sin^m cos^n',
          description: 'Strategy selection for ∫sin^m cos^n dx',
          visualizationComponent: 'TrigIntegrals',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'm', label: 'm (sin power)', min: 1, max: 7, step: 1, default: 2 },
            { id: 'n', label: 'n (cos power)', min: 1, max: 7, step: 1, default: 3 },
          ],
        },
        {
          id: 'tan-sec',
          label: 'tan^m sec^n',
          description: 'Strategy for ∫tan^m sec^n dx',
          visualizationComponent: 'TrigIntegrals',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'm', label: 'm', min: 1, max: 5, step: 1, default: 2 },
            { id: 'n', label: 'n', min: 1, max: 5, step: 1, default: 2 },
          ],
        },
      ],
    },
    {
      id: 'trig-substitution',
      title: 'Trigonometric Substitution',
      thomasSection: '§8.5',
      thomasPageStart: 520,
      defaultParadigm: 'a2-x2',
      paradigms: [
        {
          id: 'a2-x2',
          label: '√(a²−x²)',
          description: 'Triangle for x = a·sin(θ), √(a²−x²) = a·cos(θ)',
          visualizationComponent: 'TrigSubstitution',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'a', label: 'a', min: 0.5, max: 5, step: 0.5, default: 2 },
            { id: 'x', label: 'x', min: 0, max: 1, step: 0.05, default: 0.5 },
          ],
        },
        {
          id: 'a2+x2',
          label: '√(a²+x²)',
          description: 'Triangle for x = a·tan(θ), √(a²+x²) = a·sec(θ)',
          visualizationComponent: 'TrigSubstitution',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'a', label: 'a', min: 0.5, max: 5, step: 0.5, default: 2 },
            { id: 'x', label: 'x', min: 0, max: 3, step: 0.1, default: 1 },
          ],
        },
        {
          id: 'x2-a2',
          label: '√(x²−a²)',
          description: 'Triangle for x = a·sec(θ), √(x²−a²) = a·tan(θ)',
          visualizationComponent: 'TrigSubstitution',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'a', label: 'a', min: 0.5, max: 4, step: 0.5, default: 1 },
            { id: 'x', label: 'x', min: 1, max: 5, step: 0.1, default: 2 },
          ],
        },
      ],
    },
    {
      id: 'numerical-integration',
      title: 'Numerical Integration',
      thomasSection: '§8.7',
      thomasPageStart: 536,
      defaultParadigm: 'riemann',
      paradigms: [
        {
          id: 'riemann',
          label: 'Riemann Sums',
          description: 'Left, right, and midpoint Riemann sums',
          visualizationComponent: 'NumericalIntegration',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'n', label: 'n (rectangles)', min: 2, max: 50, step: 1, default: 8 },
            { id: 'a', label: 'a', min: 0, max: 1, step: 0.1, default: 0 },
            { id: 'b', label: 'b', min: 1, max: 7, step: 0.1, default: 3.14 },
          ],
        },
        {
          id: 'trapezoid',
          label: 'Trapezoid Rule',
          description: 'Trapezoidal approximation with error bound',
          visualizationComponent: 'NumericalIntegration',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'n', label: 'n', min: 2, max: 50, step: 1, default: 8 },
            { id: 'a', label: 'a', min: 0, max: 1, step: 0.1, default: 0 },
            { id: 'b', label: 'b', min: 1, max: 7, step: 0.1, default: 3.14 },
          ],
        },
        {
          id: 'simpsons',
          label: "Simpson's Rule",
          description: "Simpson's 1/3 rule with error bound",
          visualizationComponent: 'NumericalIntegration',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'n', label: 'n (must be even)', min: 2, max: 50, step: 2, default: 8 },
            { id: 'a', label: 'a', min: 0, max: 1, step: 0.1, default: 0 },
            { id: 'b', label: 'b', min: 1, max: 7, step: 0.1, default: 3.14 },
          ],
        },
      ],
    },
    {
      id: 'improper-integrals',
      title: 'Improper Integrals',
      thomasSection: '§8.8',
      thomasPageStart: 543,
      defaultParadigm: 'infinite-bound',
      paradigms: [
        {
          id: 'infinite-bound',
          label: 'Infinite Bound',
          description: '∫₁^B f(x) dx as B → ∞',
          visualizationComponent: 'ImproperIntegrals',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'p', label: 'p (exponent)', min: 0.1, max: 3, step: 0.1, default: 2 },
            { id: 'B', label: 'B (upper limit)', min: 2, max: 100, step: 1, default: 20 },
          ],
        },
        {
          id: 'vertical-asymptote',
          label: 'Vertical Asymptote',
          description: '∫_ε^1 f(x) dx as ε → 0⁺',
          visualizationComponent: 'ImproperIntegrals',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'p', label: 'p', min: 0.1, max: 2, step: 0.05, default: 0.5 },
            { id: 'eps', label: 'ε', min: 0.001, max: 0.5, step: 0.005, default: 0.1 },
          ],
        },
      ],
    },
  ],
}
