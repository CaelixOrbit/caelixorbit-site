import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import fastGlob from 'fast-glob'
import matter from 'gray-matter'
import katex from 'katex'
import MarkdownIt from 'markdown-it'

const projectRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
const sourceRoot = path.resolve(projectRoot, process.env.NOTE_SOURCE_DIR ?? 'content/Today-I-Learned')
const outputRoot = path.resolve(projectRoot, 'public/content')
const assetsRoot = path.join(outputRoot, 'assets')

const externalUrlPattern = /^(?:[a-z][a-z\d+.-]*:)?\/\//i
const assetMap = new Map()

function toSlash(value) {
  return value.split(path.sep).join('/')
}

function fail(message) {
  console.error(message)
  process.exitCode = 1
}

async function ensureSourceReady() {
  if (!existsSync(sourceRoot)) {
    fail(`找不到笔记子模块目录：${sourceRoot}\n请先运行：git submodule update --init --recursive`)
    return false
  }

  const files = await fastGlob('**/*.md', {
    cwd: sourceRoot,
    onlyFiles: true,
    ignore: ['README.md', '.git/**'],
  })

  if (files.length === 0) {
    fail(`笔记子模块中没有找到 Markdown 文件：${sourceRoot}`)
    return false
  }

  return true
}

function decodePathname(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function splitHash(value) {
  const hashIndex = value.indexOf('#')
  if (hashIndex === -1) {
    return [value, '']
  }

  return [value.slice(0, hashIndex), value.slice(hashIndex)]
}

function isLocalReference(value) {
  return (
    value &&
    !externalUrlPattern.test(value) &&
    !value.startsWith('/') &&
    !value.startsWith('#') &&
    !value.startsWith('data:') &&
    !value.startsWith('mailto:') &&
    !value.startsWith('tel:')
  )
}

function encodeNoteSlug(slug) {
  return slug.split('/').map(encodeURIComponent).join('/')
}

function registerAsset(sourceFile) {
  const relativePath = toSlash(path.relative(sourceRoot, sourceFile))
  if (relativePath.startsWith('..')) {
    return null
  }

  if (!assetMap.has(sourceFile)) {
    const ext = path.extname(sourceFile) || '.bin'
    const hash = createHash('sha1').update(relativePath).digest('hex').slice(0, 14)
    assetMap.set(sourceFile, `assets/${hash}${ext}`)
  }

  return assetMap.get(sourceFile)
}

function rewriteImageReferences(markdown, filePath) {
  return markdown.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+(['"]).*?\3)?\)/g, (match, alt, rawUrl) => {
    const cleanUrl = rawUrl.replace(/^<|>$/g, '')
    const [urlPath, hash] = splitHash(cleanUrl)

    if (!isLocalReference(urlPath)) {
      return match
    }

    const assetSource = path.resolve(path.dirname(filePath), decodePathname(urlPath))
    if (!existsSync(assetSource)) {
      return match
    }

    const assetRelativePath = registerAsset(assetSource)
    if (!assetRelativePath) {
      return match
    }

    return `![${alt}](/content/${assetRelativePath}${hash})`
  })
}

function rewriteMarkdownLinks(markdown, filePath) {
  return markdown.replace(/(?<!!)\[([^\]]+)\]\(([^)\s]+)(?:\s+(['"]).*?\3)?\)/g, (match, label, rawUrl) => {
    const cleanUrl = rawUrl.replace(/^<|>$/g, '')
    const [urlPath, hash] = splitHash(cleanUrl)

    if (!isLocalReference(urlPath) || path.extname(urlPath).toLowerCase() !== '.md') {
      return match
    }

    const targetFile = path.resolve(path.dirname(filePath), decodePathname(urlPath))
    const targetRelativePath = toSlash(path.relative(sourceRoot, targetFile))

    if (targetRelativePath.startsWith('..')) {
      return match
    }

    const targetSlug = targetRelativePath.replace(/\.md$/i, '')
    return `[${label}](/notes/${encodeNoteSlug(targetSlug)}${hash})`
  })
}

function applyFilenameOrderPrefix(title, filePath) {
  const fileTitle = path.basename(filePath, path.extname(filePath))
  const prefixMatch = fileTitle.match(/^(\d+[\s._-]*)(.+)$/)

  if (!prefixMatch || /^\d+[\s._-]*/.test(title)) {
    return title
  }

  const [, orderPrefix, filenameTitle] = prefixMatch
  if (filenameTitle.trim() === title.trim()) {
    return fileTitle
  }

  return `${orderPrefix}${title}`
}

function extractTitle(frontmatter, markdown, filePath) {
  if (typeof frontmatter.title === 'string' && frontmatter.title.trim()) {
    return applyFilenameOrderPrefix(frontmatter.title.trim(), filePath)
  }

  const heading = markdown.match(/^#\s+(.+)$/m)
  if (heading?.[1]) {
    return applyFilenameOrderPrefix(heading[1].trim(), filePath)
  }

  return path.basename(filePath, path.extname(filePath))
}

function stripFirstH1(markdown) {
  return markdown.replace(/^#\s+.+(?:\r?\n)+/, '')
}

function splitIntroMarkdown(markdown) {
  const firstSecondLevelHeading = markdown.match(/^##\s+.+$/m)

  if (!firstSecondLevelHeading || firstSecondLevelHeading.index === undefined) {
    return {
      introMarkdown: '',
      bodyMarkdown: markdown,
    }
  }

  const introMarkdown = markdown.slice(0, firstSecondLevelHeading.index).trim()

  if (!introMarkdown) {
    return {
      introMarkdown: '',
      bodyMarkdown: markdown,
    }
  }

  return {
    introMarkdown,
    bodyMarkdown: markdown.slice(firstSecondLevelHeading.index).trimStart(),
  }
}

function makeSummary(markdown) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?\[![A-Z]+]\s*$/gm, '')
    .replace(/[>*_`|#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text.length > 110 ? `${text.slice(0, 110)}...` : text
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map(String).map((tag) => tag.trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value.split(',').map((tag) => tag.trim()).filter(Boolean)
  }

  return []
}

function slugifyHeading(value, counts) {
  const base =
    value
      .trim()
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .slice(0, 80) || 'section'

  const count = counts.get(base) ?? 0
  counts.set(base, count + 1)

  return count === 0 ? base : `${base}-${count + 1}`
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

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
      env.headings.push({ depth, text, id })
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

async function copyAssets() {
  await fs.mkdir(assetsRoot, { recursive: true })

  await Promise.all(
    Array.from(assetMap.entries()).map(async ([sourceFile, assetRelativePath]) => {
      const targetFile = path.join(outputRoot, assetRelativePath)
      await fs.mkdir(path.dirname(targetFile), { recursive: true })
      await fs.copyFile(sourceFile, targetFile)
    }),
  )
}

async function build() {
  if (!(await ensureSourceReady())) {
    return
  }

  const markdown = createMarkdownRenderer()
  await fs.rm(outputRoot, { recursive: true, force: true })

  const files = await fastGlob('**/*.md', {
    cwd: sourceRoot,
    absolute: true,
    onlyFiles: true,
    ignore: ['README.md', '.git/**'],
  })

  const notes = []

  for (const filePath of files) {
    const relativePath = toSlash(path.relative(sourceRoot, filePath))
    if (relativePath.toLowerCase() === 'readme.md') {
      continue
    }

    const raw = await fs.readFile(filePath, 'utf8')
    const parsed = matter(raw)
    const title = extractTitle(parsed.data, parsed.content, filePath)
    const contentWithoutTitle = stripFirstH1(parsed.content)
    const rewrittenMarkdown = rewriteMarkdownLinks(
      rewriteImageReferences(contentWithoutTitle, filePath),
      filePath,
    )
    const { introMarkdown, bodyMarkdown } = splitIntroMarkdown(rewrittenMarkdown)
    const introEnv = { headings: [], headingCounts: new Map() }
    const env = { headings: [], headingCounts: new Map() }
    const introHtml = introMarkdown
      ? transformCallouts(markdown.render(introMarkdown, introEnv))
      : ''
    const html = transformCallouts(markdown.render(bodyMarkdown, env))
    const stats = await fs.stat(filePath)
    const slug = relativePath.replace(/\.md$/i, '')
    const pathSegments = relativePath.split('/')
    const categoryPath = pathSegments.slice(0, -1)
    const category = categoryPath[0] ?? 'Notes'
    const categoryPathLabel = categoryPath.join(' / ') || category

    notes.push({
      slug,
      title,
      category,
      categoryPath,
      categoryPathLabel,
      tags: normalizeTags(parsed.data.tags),
      summary: makeSummary(contentWithoutTitle),
      updatedAt: stats.mtime.toISOString(),
      introHtml,
      html,
      headings: env.headings,
      sourceRelativePath: relativePath,
    })
  }

  notes.sort((left, right) => {
    const categoryCompare = left.category.localeCompare(right.category, 'zh-CN')
    if (categoryCompare !== 0) {
      return categoryCompare
    }

    return left.title.localeCompare(right.title, 'zh-CN')
  })

  await copyAssets()
  await fs.mkdir(outputRoot, { recursive: true })
  await fs.writeFile(path.join(outputRoot, 'notes.json'), `${JSON.stringify(notes, null, 2)}\n`)

  console.log(`Generated ${notes.length} notes from ${toSlash(path.relative(projectRoot, sourceRoot))}.`)
}

build().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
