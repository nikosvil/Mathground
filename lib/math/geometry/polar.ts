import { parseExpression } from '@/lib/math/parser'

export interface PolarPoint {
  x: number
  y: number
  r: number
  theta: number
}

export function polarCurvePoints(
  expression: string,
  thetaMin: number,
  thetaMax: number,
  n: number
): PolarPoint[] {
  // θ is the variable; allow both 'θ' (unicode) and 't' as fallback
  let parseResult = parseExpression(expression, ['θ'])
  let useTheta = true

  if (!parseResult.valid) {
    // Try with 't' as a fallback variable name
    parseResult = parseExpression(expression, ['t'])
    useTheta = false
  }

  if (!parseResult.valid || !parseResult.fn) return []

  const fn = parseResult.fn
  const dTheta = (thetaMax - thetaMin) / (n - 1)
  const points: PolarPoint[] = []

  for (let i = 0; i < n; i++) {
    const theta = thetaMin + i * dTheta
    const scope: Record<string, number> = useTheta ? { θ: theta } : { t: theta }
    const r = fn(scope)
    if (!isFinite(r)) continue

    points.push({
      x: r * Math.cos(theta),
      y: r * Math.sin(theta),
      r,
      theta,
    })
  }

  return points
}
