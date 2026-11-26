import { parseExpression } from '@/lib/math/parser'

export interface ParametricPoint {
  x: number
  y: number
  t: number
}

export function parametricCurvePoints(
  xExpression: string,
  yExpression: string,
  tMin: number,
  tMax: number,
  n: number
): ParametricPoint[] {
  const xResult = parseExpression(xExpression, ['t'])
  if (!xResult.valid || !xResult.fn) return []

  const yResult = parseExpression(yExpression, ['t'])
  if (!yResult.valid || !yResult.fn) return []

  const xFn = xResult.fn
  const yFn = yResult.fn
  const dt = (tMax - tMin) / (n - 1)
  const points: ParametricPoint[] = []

  for (let i = 0; i < n; i++) {
    const t = tMin + i * dt
    const scope = { t }
    const x = xFn(scope)
    const y = yFn(scope)
    if (!isFinite(x) || !isFinite(y)) continue
    points.push({ x, y, t })
  }

  return points
}
