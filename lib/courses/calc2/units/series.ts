import type { Unit } from '@/lib/types'

export const seriesUnit: Unit = {
  id: 'series',
  title: 'Infinite Sequences & Series',
  thomasChapters: [11],
  topics: [
    {
      id: 'sequences',
      title: 'Sequences',
      thomasSection: '§11.1',
      thomasPageStart: 638,
      defaultParadigm: 'convergent',
      paradigms: [
        {
          id: 'convergent',
          title: 'Convergent',
          description: 'a_n → L as n → ∞',
          visualizationComponent: 'Sequences',
          inputs: { type: 'single', variable: 'x', label: 'a_n' },
          sliders: [
            { id: 'N', label: 'N terms', min: 5, max: 100, step: 5, default: 30 },
          ],
        },
        {
          id: 'oscillating',
          title: 'Oscillating',
          description: 'Oscillates but converges: (-1)^n/n',
          visualizationComponent: 'Sequences',
          inputs: { type: 'single', variable: 'x', label: 'a_n' },
          sliders: [
            { id: 'N', label: 'N terms', min: 5, max: 100, step: 5, default: 40 },
          ],
        },
        {
          id: 'divergent',
          title: 'Divergent',
          description: 'Grows without bound',
          visualizationComponent: 'Sequences',
          inputs: { type: 'single', variable: 'x', label: 'a_n' },
          sliders: [
            { id: 'N', label: 'N terms', min: 5, max: 50, step: 5, default: 20 },
          ],
        },
      ],
    },
    {
      id: 'infinite-series',
      title: 'Infinite Series & Partial Sums',
      thomasSection: '§11.2',
      thomasPageStart: 648,
      defaultParadigm: 'geometric',
      paradigms: [
        {
          id: 'geometric',
          title: 'Geometric Series',
          description: 'Σ ar^n, converges when |r| < 1',
          visualizationComponent: 'SeriesPartialSums',
          inputs: { type: 'single', variable: 'x', label: 'a_n' },
          sliders: [
            { id: 'r', label: 'r (ratio)', min: -0.99, max: 0.99, step: 0.01, default: 0.5 },
            { id: 'N', label: 'N terms', min: 1, max: 50, step: 1, default: 20 },
          ],
        },
        {
          id: 'telescoping',
          title: 'Telescoping',
          description: 'Partial fractions collapse',
          visualizationComponent: 'SeriesPartialSums',
          inputs: { type: 'single', variable: 'x', label: 'a_n' },
          sliders: [
            { id: 'N', label: 'N terms', min: 2, max: 50, step: 1, default: 15 },
          ],
        },
        {
          id: 'harmonic',
          title: 'Harmonic (Divergent)',
          description: 'Σ 1/n diverges — partial sums grow unbounded',
          visualizationComponent: 'SeriesPartialSums',
          inputs: { type: 'single', variable: 'x', label: 'a_n' },
          sliders: [
            { id: 'N', label: 'N terms', min: 5, max: 200, step: 5, default: 50 },
          ],
        },
      ],
    },
    {
      id: 'convergence-tests',
      title: 'Convergence Tests',
      thomasSection: '§11.3–11.5',
      thomasPageStart: 658,
      defaultParadigm: 'integral-test',
      paradigms: [
        {
          id: 'integral-test',
          title: 'Integral Test',
          description: 'Compare series to integral of f(x)',
          visualizationComponent: 'ConvergenceTests',
          inputs: { type: 'single', variable: 'x', label: 'f(x)' },
          sliders: [
            { id: 'p', label: 'p', min: 0.5, max: 3, step: 0.1, default: 2 },
            { id: 'N', label: 'N', min: 2, max: 30, step: 1, default: 10 },
          ],
        },
        {
          id: 'comparison-test',
          title: 'Comparison Test',
          description: 'Compare a_n ≤ b_n; b_n convergent → a_n convergent',
          visualizationComponent: 'ConvergenceTests',
          inputs: { type: 'single', variable: 'x', label: 'a_n' },
          sliders: [
            { id: 'N', label: 'N terms', min: 5, max: 50, step: 1, default: 20 },
          ],
        },
        {
          id: 'ratio-test',
          title: 'Ratio Test',
          description: 'L = lim |a_{n+1}/a_n|; L < 1 → converges',
          visualizationComponent: 'ConvergenceTests',
          inputs: { type: 'single', variable: 'x', label: 'a_n' },
          sliders: [
            { id: 'N', label: 'N', min: 5, max: 50, step: 1, default: 20 },
          ],
        },
        {
          id: 'root-test',
          title: 'Root Test',
          description: 'L = lim |a_n|^(1/n)',
          visualizationComponent: 'ConvergenceTests',
          inputs: { type: 'single', variable: 'x', label: 'a_n' },
          sliders: [
            { id: 'N', label: 'N', min: 5, max: 50, step: 1, default: 20 },
          ],
        },
      ],
    },
    {
      id: 'alternating-series',
      title: 'Alternating Series',
      thomasSection: '§11.6',
      thomasPageStart: 674,
      defaultParadigm: 'zigzag',
      paradigms: [
        {
          id: 'zigzag',
          title: 'Zigzag Convergence',
          description: 'Partial sums oscillate toward the limit',
          visualizationComponent: 'AlternatingSeries',
          inputs: { type: 'single', variable: 'x', label: 'b_n' },
          sliders: [
            { id: 'N', label: 'N terms', min: 2, max: 40, step: 1, default: 15 },
          ],
        },
        {
          id: 'error-bound',
          title: 'Error Bound',
          description: '|S - S_N| ≤ |a_{N+1}|',
          visualizationComponent: 'AlternatingSeries',
          inputs: { type: 'single', variable: 'x', label: 'b_n' },
          sliders: [
            { id: 'N', label: 'N', min: 2, max: 30, step: 1, default: 8 },
          ],
        },
      ],
    },
    {
      id: 'power-series',
      title: 'Power Series',
      thomasSection: '§11.7–11.8',
      thomasPageStart: 681,
      defaultParadigm: 'geometric-power',
      paradigms: [
        {
          id: 'geometric-power',
          title: '1/(1−x)',
          description: 'Geometric power series Σ xⁿ, |x| < 1',
          visualizationComponent: 'PowerSeries',
          inputs: { type: 'single', variable: 'x', label: 'c_n' },
          sliders: [
            { id: 'N', label: 'Degree N', min: 1, max: 20, step: 1, default: 5 },
          ],
        },
        {
          id: 'radius-of-convergence',
          title: 'Radius of Convergence',
          description: 'Visualize the interval where the series converges',
          visualizationComponent: 'PowerSeries',
          inputs: { type: 'single', variable: 'x', label: 'c_n' },
          sliders: [
            { id: 'N', label: 'N', min: 1, max: 15, step: 1, default: 6 },
            { id: 'R', label: 'R (radius)', min: 0.5, max: 5, step: 0.5, default: 1 },
          ],
        },
      ],
    },
    {
      id: 'taylor-maclaurin',
      title: 'Taylor & Maclaurin Series',
      thomasSection: '§11.9–11.10',
      thomasPageStart: 693,
      defaultParadigm: 'sin',
      paradigms: [
        {
          id: 'sin',
          title: 'sin(x)',
          description: 'Degree-N Taylor polynomial for sin(x) at x₀=0',
          visualizationComponent: 'TaylorSeries',
          inputs: { type: 'single', variable: 'x', label: 'f(x)' },
          sliders: [
            { id: 'N', label: 'Degree N', min: 1, max: 15, step: 2, default: 3 },
          ],
        },
        {
          id: 'exp',
          title: 'eˣ',
          description: 'Degree-N Taylor polynomial for eˣ at x₀=0',
          visualizationComponent: 'TaylorSeries',
          inputs: { type: 'single', variable: 'x', label: 'f(x)' },
          sliders: [
            { id: 'N', label: 'Degree N', min: 1, max: 12, step: 1, default: 4 },
          ],
        },
        {
          id: 'cos',
          title: 'cos(x)',
          description: 'Degree-N Taylor polynomial for cos(x) at x₀=0',
          visualizationComponent: 'TaylorSeries',
          inputs: { type: 'single', variable: 'x', label: 'f(x)' },
          sliders: [
            { id: 'N', label: 'Degree N', min: 1, max: 15, step: 2, default: 4 },
          ],
        },
        {
          id: 'ln',
          title: 'ln(1+x)',
          description: 'Degree-N Taylor polynomial for ln(1+x) at x₀=0',
          visualizationComponent: 'TaylorSeries',
          inputs: { type: 'single', variable: 'x', label: 'f(x)' },
          sliders: [
            { id: 'N', label: 'Degree N', min: 1, max: 12, step: 1, default: 5 },
          ],
        },
        {
          id: 'custom',
          title: 'Custom f(x)',
          description: 'Enter your own function',
          visualizationComponent: 'TaylorSeries',
          inputs: { type: 'single', variable: 'x', label: 'f(x)' },
          sliders: [
            { id: 'N', label: 'Degree N', min: 1, max: 12, step: 1, default: 4 },
            { id: 'x0', label: 'x₀', min: -3, max: 3, step: 0.1, default: 0 },
          ],
        },
      ],
    },
    {
      id: 'fourier-series',
      title: 'Fourier Series',
      thomasSection: '§11.11',
      thomasPageStart: 710,
      defaultParadigm: 'square-wave',
      paradigms: [
        {
          id: 'square-wave',
          title: 'Square Wave',
          description: 'Fourier series approximation of a square wave',
          visualizationComponent: 'TaylorSeries',
          inputs: { type: 'single', variable: 'x', label: 'f(x)' },
          sliders: [
            { id: 'N', label: 'N harmonics', min: 1, max: 20, step: 1, default: 5 },
          ],
        },
        {
          id: 'sawtooth',
          title: 'Sawtooth Wave',
          description: 'Fourier series for the sawtooth function',
          visualizationComponent: 'TaylorSeries',
          inputs: { type: 'single', variable: 'x', label: 'f(x)' },
          sliders: [
            { id: 'N', label: 'N harmonics', min: 1, max: 20, step: 1, default: 5 },
          ],
        },
      ],
    },
  ],
}
