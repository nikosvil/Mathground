import * as math from 'mathjs'
import type { ParseResult } from '@/lib/types'

// Built-in mathjs functions and constants that are safe to use
const SAFE_SYMBOLS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
  'sqrt', 'cbrt', 'abs', 'ceil', 'floor', 'round', 'sign',
  'exp', 'log', 'log2', 'log10', 'ln',
  'pow', 'mod', 'min', 'max',
  'pi', 'e', 'Infinity', 'NaN', 'true', 'false',
  'i', // imaginary unit — allowed but fn clamps Infinity
])

function containsOnlyAllowedSymbols(
  node: math.MathNode,
  allowedVariables: string[]
): boolean {
  if (node.type === 'SymbolNode') {
    const sym = (node as math.SymbolNode).name
    return SAFE_SYMBOLS.has(sym) || allowedVariables.includes(sym)
  }
  if (node.type === 'FunctionNode') {
    const fn = node as math.FunctionNode<math.SymbolNode>
    if (!SAFE_SYMBOLS.has(fn.fn.name)) return false
    return fn.args.every((arg) => containsOnlyAllowedSymbols(arg, allowedVariables))
  }
  // OperatorNode, ConstantNode, ParenthesisNode, ArrayNode — recurse into children
  if ('args' in node && Array.isArray((node as unknown as { args: math.MathNode[] }).args)) {
    return (node as unknown as { args: math.MathNode[] }).args.every((child) =>
      containsOnlyAllowedSymbols(child, allowedVariables)
    )
  }
  if ('content' in node) {
    return containsOnlyAllowedSymbols(
      (node as unknown as { content: math.MathNode }).content,
      allowedVariables
    )
  }
  // ConstantNode (numbers) are always safe
  return node.type === 'ConstantNode'
}

export function parseExpression(
  expression: string,
  allowedVariables: string[]
): ParseResult {
  if (!expression.trim()) {
    return { valid: false, error: 'Expression is empty.' }
  }

  // Detect implicit multiplication: a letter (including Unicode/Greek) or ( immediately after a digit
  // e.g. "2x", "2θ", "3sin(x)", "2(x+1)" without explicit operator
  const implicitMulPattern = /\d[a-zA-ZͰ-Ͽ(]/u
  if (implicitMulPattern.test(expression)) {
    return {
      valid: false,
      error: 'Use * for multiplication: e.g. 2*x instead of 2x.',
    }
  }

  let parsed: math.MathNode
  try {
    parsed = math.parse(expression)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { valid: false, error: msg }
  }

  if (!containsOnlyAllowedSymbols(parsed, allowedVariables)) {
    return {
      valid: false,
      error: `Expression uses disallowed symbols. Allowed variables: ${allowedVariables.join(', ')}.`,
    }
  }

  let compiled: math.EvalFunction
  try {
    compiled = parsed.compile()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { valid: false, error: msg }
  }

  return {
    valid: true,
    fn: (scope: Record<string, number>) => {
      try {
        const result = compiled.evaluate(scope)
        // mathjs can return a Complex; take real part
        if (typeof result === 'number') return result
        if (result && typeof result === 'object' && 're' in result) return (result as { re: number }).re
        return NaN
      } catch {
        return NaN
      }
    },
  }
}
