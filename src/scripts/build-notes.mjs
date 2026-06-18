import fs from 'node:fs/promises'
import path from 'node:path'

import fastGlob from 'fast-glob'
import matter from 'gray-matter'

import { copyAssets } from './build-notes/assets.mjs'
import { outputRoot, projectRoot, sourceRoot } from './build-notes/config.mjs'
import { extractTitle, makeSummary, normalizeTags, rewriteImageReferences, rewriteMarkdownLinks, splitIntroMarkdown, stripFirstH1 } from './build-notes/content.mjs'
import { createMarkdownRenderer, transformCallouts } from './build-notes/markdown-renderer.mjs'
import { ensureSourceReady, getGitCommitDate, renderInlineLatex, toSlash } from './build-notes/utils.mjs'

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
    const gitDate = getGitCommitDate(filePath)
    const stats = await fs.stat(filePath)
    const slug = relativePath.replace(/\.md$/i, '')
    const pathSegments = relativePath.split('/')
    const categoryPath = pathSegments.slice(0, -1)
    const category = categoryPath[0] ?? 'Notes'
    const categoryPathLabel = categoryPath.join(' / ') || category

    notes.push({
      slug,
      title,
      titleHtml: renderInlineLatex(title),
      category,
      categoryPath,
      categoryPathLabel,
      tags: normalizeTags(parsed.data.tags),
      summary: makeSummary(contentWithoutTitle),
      updatedAt: gitDate ?? stats?.mtime.toISOString() ?? new Date().toISOString(),
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
