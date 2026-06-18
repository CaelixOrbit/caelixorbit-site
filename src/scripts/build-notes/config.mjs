import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)))
const sourceRoot = path.resolve(projectRoot, process.env.NOTE_SOURCE_DIR ?? 'content/Today-I-Learned')
const outputRoot = path.resolve(projectRoot, 'public/content')
const assetsRoot = path.join(outputRoot, 'assets')

const externalUrlPattern = /^(?:[a-z][a-z\d+.-]*:)?\/\//i
const assetMap = new Map()

export { assetMap, assetsRoot, externalUrlPattern, outputRoot, projectRoot, sourceRoot }
