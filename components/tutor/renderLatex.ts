import katex from 'katex'

export function renderLatex(text: string): string {
  // Replace display math $$...$$ first (must come before inline)
  let result = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex: string) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false })
    } catch {
      return `$$${tex}$$`
    }
  })

  // Replace inline math $...$
  result = result.replace(/\$([^$\n]+?)\$/g, (_, tex: string) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return `$${tex}$`
    }
  })

  return result
}
