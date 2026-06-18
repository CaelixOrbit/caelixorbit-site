import katex from 'katex'
import MarkdownIt from 'markdown-it'

import { externalUrlPattern } from './config.mjs'
import { escapeHtml, renderInlineLatex, slugifyHeading } from './utils.mjs'

function renderMath(content, displayMode) {
  return katex.renderToString(content, {
    displayMode,
    output: 'htmlAndMathml',
    throwOnError: false,
    strict: 'warn',
    trust: false,
  })
}

function findInlineMathEnd(source, start) {
  for (let index = start; index < source.length; index += 1) {
    if (source[index] !== '$') {
      continue
    }

    let backslashCount = 0
    for (let cursor = index - 1; cursor >= 0 && source[cursor] === '\\'; cursor -= 1) {
      backslashCount += 1
    }

    if (backslashCount % 2 === 0) {
      return index
    }
  }

  return -1
}

function mathInlineRule(state, silent) {
  const start = state.pos

  if (state.src[start] !== '$' || state.src[start + 1] === '$') {
    return false
  }

  const end = findInlineMathEnd(state.src, start + 1)
  if (end === -1) {
    return false
  }

  const content = state.src.slice(start + 1, end)
  if (!content.trim()) {
    return false
  }

  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.content = content
    token.markup = '$'
  }

  state.pos = end + 1
  return true
}

function mathBlockRule(state, startLine, endLine, silent) {
  const start = state.bMarks[startLine] + state.tShift[startLine]
  const max = state.eMarks[startLine]
  const firstLine = state.src.slice(start, max).trim()

  if (!firstLine.startsWith('$$')) {
    return false
  }

  const firstLineContent = firstLine.slice(2).trim()
  if (firstLineContent.endsWith('$$') && firstLineContent.length > 2) {
    if (!silent) {
      const token = state.push('math_block', 'math', 0)
      token.block = true
      token.content = firstLineContent.slice(0, -2).trim()
      token.map = [startLine, startLine + 1]
      token.markup = '$$'
    }

    state.line = startLine + 1
    return true
  }

  if (firstLine !== '$$') {
    return false
  }

  let nextLine = startLine
  const contentLines = []

  while ((nextLine += 1) < endLine) {
    const lineStart = state.bMarks[nextLine] + state.tShift[nextLine]
    const lineMax = state.eMarks[nextLine]
    const line = state.src.slice(lineStart, lineMax)

    if (line.trim() === '$$') {
      if (!silent) {
        const token = state.push('math_block', 'math', 0)
        token.block = true
        token.content = contentLines.join('\n')
        token.map = [startLine, nextLine + 1]
        token.markup = '$$'
      }

      state.line = nextLine + 1
      return true
    }

    contentLines.push(line)
  }

  return false
}

function useMath(markdown) {
  markdown.inline.ruler.before('escape', 'math_inline', mathInlineRule)
  markdown.block.ruler.before('fence', 'math_block', mathBlockRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })

  markdown.renderer.rules.math_inline = (tokens, idx) => renderMath(tokens[idx].content, false)
  markdown.renderer.rules.math_block = (tokens, idx) =>
    `<div class="math-block">${renderMath(tokens[idx].content, true)}</div>`
}

function createMarkdownRenderer() {
  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    highlight(code, lang) {
      const language = lang ? lang.trim() : ''
      if (language === 'mermaid') {
        return `<pre class="mermaid">${escapeHtml(code)}</pre>`
      }

      const className = language ? ` class="language-${escapeHtml(language)}"` : ''
      return `<pre><code${className}>${escapeHtml(code)}</code></pre>`
    },
  })

  useMath(markdown)

  const defaultHeadingOpen =
    markdown.renderer.rules.heading_open ??
    ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))

  markdown.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const inlineToken = tokens[idx + 1]
    const text = inlineToken?.content ?? ''
    const depth = Number(token.tag.replace('h', ''))
    const id = slugifyHeading(text, env.headingCounts)

    token.attrSet('id', id)

    if (depth >= 2 && depth <= 3) {
      env.headings.push({ depth, text, html: renderInlineLatex(text), id })
    }

    return defaultHeadingOpen(tokens, idx, options, env, self)
  }

  const defaultLinkOpen =
    markdown.renderer.rules.link_open ??
    ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))

  markdown.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const href = token.attrGet('href') ?? ''

    if (externalUrlPattern.test(href)) {
      token.attrSet('target', '_blank')
      token.attrSet('rel', 'noreferrer')
    }

    return defaultLinkOpen(tokens, idx, options, env, self)
  }

  return markdown
}

function transformCallouts(html) {
  return html.replace(
    /<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)]<\/p>\s*([\s\S]*?)<\/blockquote>/g,
    (_, type, body) => {
      const normalized = type.toLowerCase()
      const titleMap = {
        note: 'NOTE',
        tip: 'TIP',
        important: 'IMPORTANT',
        warning: 'WARNING',
        caution: 'CAUTION',
      }

      return `<aside class="callout callout-${normalized}"><p class="callout-title">${titleMap[normalized]}</p>${body}</aside>`
    },
  )
}

export { createMarkdownRenderer, transformCallouts }
