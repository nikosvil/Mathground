import { parseExpression } from '@/lib/math/parser'

export interface SeriesPoint {
  x: number
  y: number
}

export interface PartialSumPoint {
  n: number
  term: number
  partial: number
}

function factorial(n: number): number {
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}

function binomial(n: number, k: number): number {
  return factorial(n) / (factorial(k) * factorial(n - k))
}

// k-th derivative via forward finite differences.
// Step size h ≈ eps^(1/(k+1)) balances truncation and cancellation errors.
function nthDerivative(fn: (scope: Record<string, number>) => number, x0: number, k: number): number {
  if (k === 0) return fn({ x: x0 })
  const eps = 2.2e-16
  const h = Math.pow(eps, 1 / (k + 1)) * Math.max(1, Math.abs(x0))
  let acc = 0
  for (let m = 0; m <= k; m++) {
    const sign = (k - m) % 2 === 0 ? 1 : -1
    acc += sign * binomial(k, m) * fn({ x: x0 + m * h })
  }
  return acc / Math.pow(h, k)
}

export function taylorPoints(
  expression: string,
  x0: number,
  degree: number,
  xMin: number,
  xMax: number,
  n: number
): SeriesPoint[] {
  const parseResult = parseExpression(expression, ['x'])
  if (!parseResult.valid || !parseResult.fn) return []

  const fn = parseResult.fn

  // Compute Taylor coefficients c_k = f^(k)(x0) / k!
  const coefficients: number[] = []
  for (let k = 0; k <= degree; k++) {
    const deriv = nthDerivative(fn, x0, k)
    coefficients.push(isFinite(deriv) ? deriv / factorial(k) : 0)
  }

  const dx = (xMax - xMin) / (n - 1)
  const points: SeriesPoint[] = []

  for (let i = 0; i < n; i++) {
    const x = xMin + i * dx
    const t = x - x0
    let y = 0
    let power = 1
    for (let k = 0; k <= degree; k++) {
      y += coefficients[k] * power
      power *= t
    }
    if (isFinite(y)) {
      points.push({ x, y })
    }
  }

  return points
}

export function partialSumPoints(
  termFn: (n: number) => number,
  numTerms: number
): PartialSumPoint[] {
  const points: PartialSumPoint[] = []
  let partial = 0

  for (let n = 0; n < numTerms; n++) {
    const term = termFn(n)
    partial += isFinite(term) ? term : 0
    points.push({ n, term, partial })
  }

  return points
}
