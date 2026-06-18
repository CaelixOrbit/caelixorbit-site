import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import { assetMap, assetsRoot, outputRoot, sourceRoot } from './config.mjs'
import { toSlash } from './utils.mjs'

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

export { copyAssets, registerAsset }
