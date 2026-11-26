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
          label: 'Convergent',
          description: 'a_n → L as n → ∞',
          visualizationComponent: 'Sequences',
          customInputSchema: { type: 'single', variable: 'x', label: 'a_n' },
          defaultSliders: [
            { id: 'N', label: 'N terms', min: 5, max: 100, step: 5, default: 30 },
          ],
        },
        {
          id: 'oscillating',
          label: 'Oscillating',
          description: 'Oscillates but converges: (-1)^n/n',
          visualizationComponent: 'Sequences',
          customInputSchema: { type: 'single', variable: 'x', label: 'a_n' },
          defaultSliders: [
            { id: 'N', label: 'N terms', min: 5, max: 100, step: 5, default: 40 },
          ],
        },
        {
          id: 'divergent',
          label: 'Divergent',
          description: 'Grows without bound',
          visualizationComponent: 'Sequences',
          customInputSchema: { type: 'single', variable: 'x', label: 'a_n' },
          defaultSliders: [
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
          label: 'Geometric Series',
          description: 'Σ ar^n, converges when |r| < 1',
          visualizationComponent: 'SeriesPartialSums',
          customInputSchema: { type: 'single', variable: 'x', label: 'a_n' },
          defaultSliders: [
            { id: 'r', label: 'r (ratio)', min: -0.99, max: 0.99, step: 0.01, default: 0.5 },
            { id: 'N', label: 'N terms', min: 1, max: 50, step: 1, default: 20 },
          ],
        },
        {
          id: 'telescoping',
          label: 'Telescoping',
          description: 'Partial fractions collapse',
          visualizationComponent: 'SeriesPartialSums',
          customInputSchema: { type: 'single', variable: 'x', label: 'a_n' },
          defaultSliders: [
            { id: 'N', label: 'N terms', min: 2, max: 50, step: 1, default: 15 },
          ],
        },
        {
          id: 'harmonic',
          label: 'Harmonic (Divergent)',
          description: 'Σ 1/n diverges — partial sums grow unbounded',
          visualizationComponent: 'SeriesPartialSums',
          customInputSchema: { type: 'single', variable: 'x', label: 'a_n' },
          defaultSliders: [
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
          label: 'Integral Test',
          description: 'Compare series to integral of f(x)',
          visualizationComponent: 'ConvergenceTests',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'p', label: 'p', min: 0.5, max: 3, step: 0.1, default: 2 },
            { id: 'N', label: 'N', min: 2, max: 30, step: 1, default: 10 },
          ],
        },
        {
          id: 'comparison-test',
          label: 'Comparison Test',
          description: 'Compare a_n ≤ b_n; b_n convergent → a_n convergent',
          visualizationComponent: 'ConvergenceTests',
          customInputSchema: { type: 'single', variable: 'x', label: 'a_n' },
          defaultSliders: [
            { id: 'N', label: 'N terms', min: 5, max: 50, step: 1, default: 20 },
          ],
        },
        {
          id: 'ratio-test',
          label: 'Ratio Test',
          description: 'L = lim |a_{n+1}/a_n|; L < 1 → converges',
          visualizationComponent: 'ConvergenceTests',
          customInputSchema: { type: 'single', variable: 'x', label: 'a_n' },
          defaultSliders: [
            { id: 'N', label: 'N', min: 5, max: 50, step: 1, default: 20 },
          ],
        },
        {
          id: 'root-test',
          label: 'Root Test',
          description: 'L = lim |a_n|^(1/n)',
          visualizationComponent: 'ConvergenceTests',
          customInputSchema: { type: 'single', variable: 'x', label: 'a_n' },
          defaultSliders: [
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
          label: 'Zigzag Convergence',
          description: 'Partial sums oscillate toward the limit',
          visualizationComponent: 'AlternatingSeries',
          customInputSchema: { type: 'single', variable: 'x', label: 'b_n' },
          defaultSliders: [
            { id: 'N', label: 'N terms', min: 2, max: 40, step: 1, default: 15 },
          ],
        },
        {
          id: 'error-bound',
          label: 'Error Bound',
          description: '|S - S_N| ≤ |a_{N+1}|',
          visualizationComponent: 'AlternatingSeries',
          customInputSchema: { type: 'single', variable: 'x', label: 'b_n' },
          defaultSliders: [
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
          label: '1/(1−x)',
          description: 'Geometric power series Σ xⁿ, |x| < 1',
          visualizationComponent: 'PowerSeries',
          customInputSchema: { type: 'single', variable: 'x', label: 'c_n' },
          defaultSliders: [
            { id: 'N', label: 'Degree N', min: 1, max: 20, step: 1, default: 5 },
          ],
        },
        {
          id: 'radius-of-convergence',
          label: 'Radius of Convergence',
          description: 'Visualize the interval where the series converges',
          visualizationComponent: 'PowerSeries',
          customInputSchema: { type: 'single', variable: 'x', label: 'c_n' },
          defaultSliders: [
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
          label: 'sin(x)',
          description: 'Degree-N Taylor polynomial for sin(x) at x₀=0',
          visualizationComponent: 'TaylorSeries',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'N', label: 'Degree N', min: 1, max: 15, step: 2, default: 3 },
          ],
        },
        {
          id: 'exp',
          label: 'eˣ',
          description: 'Degree-N Taylor polynomial for eˣ at x₀=0',
          visualizationComponent: 'TaylorSeries',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'N', label: 'Degree N', min: 1, max: 12, step: 1, default: 4 },
          ],
        },
        {
          id: 'cos',
          label: 'cos(x)',
          description: 'Degree-N Taylor polynomial for cos(x) at x₀=0',
          visualizationComponent: 'TaylorSeries',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'N', label: 'Degree N', min: 1, max: 15, step: 2, default: 4 },
          ],
        },
        {
          id: 'ln',
          label: 'ln(1+x)',
          description: 'Degree-N Taylor polynomial for ln(1+x) at x₀=0',
          visualizationComponent: 'TaylorSeries',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'N', label: 'Degree N', min: 1, max: 12, step: 1, default: 5 },
          ],
        },
        {
          id: 'custom',
          label: 'Custom f(x)',
          description: 'Enter your own function',
          visualizationComponent: 'TaylorSeries',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
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
          label: 'Square Wave',
          description: 'Fourier series approximation of a square wave',
          visualizationComponent: 'TaylorSeries',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'N', label: 'N harmonics', min: 1, max: 20, step: 1, default: 5 },
          ],
        },
        {
          id: 'sawtooth',
          label: 'Sawtooth Wave',
          description: 'Fourier series for the sawtooth function',
          visualizationComponent: 'TaylorSeries',
          customInputSchema: { type: 'single', variable: 'x', label: 'f(x)' },
          defaultSliders: [
            { id: 'N', label: 'N harmonics', min: 1, max: 20, step: 1, default: 5 },
          ],
        },
      ],
    },
  ],
}
