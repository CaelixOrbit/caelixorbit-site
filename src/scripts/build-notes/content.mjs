import { existsSync } from 'node:fs'
import path from 'node:path'

import { sourceRoot } from './config.mjs'
import { decodePathname, encodeNoteSlug, isLocalReference, splitHash, toSlash } from './utils.mjs'
import { registerAsset } from './assets.mjs'

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

export {
  applyFilenameOrderPrefix,
  extractTitle,
  makeSummary,
  normalizeTags,
  rewriteImageReferences,
  rewriteMarkdownLinks,
  splitIntroMarkdown,
  stripFirstH1,
}
