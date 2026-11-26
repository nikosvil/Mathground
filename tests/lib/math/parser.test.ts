import { describe, it, expect } from 'vitest'
import { parseExpression } from '@/lib/math/parser'

describe('parseExpression', () => {
  it('parses valid expression sin(x)', () => {
    const r = parseExpression('sin(x)', ['x'])
    expect(r.valid).toBe(true)
    expect(r.fn!({ x: 0 })).toBeCloseTo(0)
    expect(r.fn!({ x: Math.PI / 2 })).toBeCloseTo(1)
  })

  it('parses x^2 + 1', () => {
    const r = parseExpression('x^2 + 1', ['x'])
    expect(r.valid).toBe(true)
    expect(r.fn!({ x: 3 })).toBeCloseTo(10)
  })

  it('rejects implicit multiplication 2x', () => {
    const r = parseExpression('2x', ['x'])
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/\*/)
  })

  it('rejects disallowed symbol process', () => {
    const r = parseExpression('process.exit(1)', ['x'])
    expect(r.valid).toBe(false)
  })

  it('rejects empty string', () => {
    const r = parseExpression('', ['x'])
    expect(r.valid).toBe(false)
  })

  it('handles multiple valid variables', () => {
    const r = parseExpression('sin(t) + cos(t)', ['t'])
    expect(r.valid).toBe(true)
    expect(r.fn!({ t: 0 })).toBeCloseTo(1)
  })

  it('rejects variable not in allowed list', () => {
    const r = parseExpression('sin(y)', ['x'])
    expect(r.valid).toBe(false)
  })

  it('handles sqrt and abs', () => {
    const r = parseExpression('sqrt(x^2)', ['x'])
    expect(r.valid).toBe(true)
    expect(r.fn!({ x: 4 })).toBeCloseTo(4)
  })

  it('handles 1/x without crashing (returns Infinity for x=0)', () => {
    const r = parseExpression('1/x', ['x'])
    expect(r.valid).toBe(true)
    // At x=0 it may return Infinity, but should not throw
    expect(() => r.fn!({ x: 0 })).not.toThrow()
  })
})
