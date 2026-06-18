import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

import fastGlob from 'fast-glob'
import katex from 'katex'

import { externalUrlPattern, sourceRoot } from './config.mjs'

function toSlash(value) {
  return value.split(path.sep).join('/')
}

function fail(message) {
  console.error(message)
  process.exitCode = 1
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

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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

function renderInlineLatex(value) {
  return value.replace(/\$([^$]+)\$/g, (_, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        output: 'htmlAndMathml',
        throwOnError: false,
        strict: 'warn',
        trust: false,
      })
    } catch {
      return formula
    }
  })
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

function getGitCommitDate(filePath) {
  try {
    const result = execSync(
      `git log -1 --format=%cI -- "${filePath}"`,
      { cwd: sourceRoot, encoding: 'utf8' },
    ).trim()
    return result || null
  } catch {
    return null
  }
}

export {
  decodePathname,
  encodeNoteSlug,
  ensureSourceReady,
  escapeHtml,
  fail,
  getGitCommitDate,
  isLocalReference,
  renderInlineLatex,
  slugifyHeading,
  splitHash,
  toSlash,
}
