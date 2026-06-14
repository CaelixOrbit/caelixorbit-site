<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import type { NoteItem } from '@/types/notes'
import {
  categoryPathKey,
  encodeNoteSlug,
  fetchNotes,
  formatDate,
  formatNotePath,
  getNoteCategoryPath,
  routeSlugToNoteSlug,
} from '@/utils/notes'

const route = useRoute()

const notes = ref<NoteItem[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const articleRef = ref<HTMLElement | null>(null)
const languageLabelMap: Record<string, string> = {
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  zsh: 'Shell',
  powershell: 'PowerShell',
  ps1: 'PowerShell',
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  vue: 'Vue',
  json: 'JSON',
  html: 'HTML',
  css: 'CSS',
  text: 'Text',
}

const mermaidThemeVariables = {
  darkMode: true,
  background: 'transparent',
  primaryColor: '#10243a',
  primaryBorderColor: '#76dcff',
  primaryTextColor: '#f8fbff',
  secondaryColor: '#17314d',
  secondaryBorderColor: '#f7d878',
  secondaryTextColor: '#f8fbff',
  tertiaryColor: '#0a1828',
  tertiaryBorderColor: '#335b7a',
  tertiaryTextColor: '#dce7f3',
  mainBkg: '#10243a',
  secondBkg: '#17314d',
  nodeBorder: '#76dcff',
  clusterBkg: '#0d1e31',
  clusterBorder: '#335b7a',
  lineColor: '#8db0cc',
  textColor: '#e6f3ed',
  nodeTextColor: '#f8fbff',
  arrowheadColor: '#f7d878',
  edgeLabelBackground: '#07111d',
  titleColor: '#76dcff',
  fontFamily: 'Inter, "Segoe UI", "Microsoft YaHei", system-ui, sans-serif',
}

const currentSlug = computed(() => {
  const slug = route.params.slug
  return typeof slug === 'string' || Array.isArray(slug) ? routeSlugToNoteSlug(slug) : ''
})

const note = computed(() => notes.value.find((item) => item.slug === currentSlug.value))

// 按文件夹/文件顺序排列（category → title），用于上下篇导航
const sortedNotes = computed(() =>
  [...notes.value].sort((a, b) => {
    const catA = categoryPathKey(getNoteCategoryPath(a))
    const catB = categoryPathKey(getNoteCategoryPath(b))
    const catCompare = catA.localeCompare(catB, 'zh-CN')
    if (catCompare !== 0) return catCompare
    return a.title.localeCompare(b.title, 'zh-CN', { numeric: true })
  }),
)

const currentNoteIndex = computed(() => {
  if (!note.value) {
    return -1
  }

  return sortedNotes.value.findIndex((item) => item.slug === note.value?.slug)
})

const currentCategoryKey = computed(() => {
  if (!note.value) return ''
  return categoryPathKey(getNoteCategoryPath(note.value))
})

const previousNote = computed(() => {
  const index = currentNoteIndex.value
  if (index <= 0) return null
  const prev = sortedNotes.value[index - 1] ?? null
  if (!prev) return null
  if (categoryPathKey(getNoteCategoryPath(prev)) !== currentCategoryKey.value) return null
  return prev
})

const nextNote = computed(() => {
  const index = currentNoteIndex.value
  if (index < 0 || index >= sortedNotes.value.length - 1) return null
  const next = sortedNotes.value[index + 1] ?? null
  if (!next) return null
  if (categoryPathKey(getNoteCategoryPath(next)) !== currentCategoryKey.value) return null
  return next
})

const categoryCrumbs = computed(() => {
  if (!note.value) {
    return []
  }

  const segments = getNoteCategoryPath(note.value)
  return segments.map((label, index) => ({
    label,
    key: categoryPathKey(segments.slice(0, index + 1)),
  }))
})

async function copyText(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value)
      return
    } catch {
      // Some embedded browser contexts expose Clipboard API but still reject writes.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.append(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)

  try {
    const didCopy = document.execCommand('copy')
    if (!didCopy) {
      throw new Error('Copy command failed')
    }
  } finally {
    textarea.remove()
  }
}

function enhanceCodeBlocks() {
  const article = articleRef.value
  if (!article) {
    return
  }

  const blocks = Array.from(article.querySelectorAll<HTMLPreElement>('pre:not(.mermaid)'))

  blocks.forEach((block) => {
    if (block.dataset.copyEnhanced === 'true') {
      return
    }

    block.dataset.copyEnhanced = 'true'
    block.classList.add('copyable-code')

    const code = block.querySelector('code')
    const languageClass = Array.from(code?.classList ?? []).find((className) =>
      className.startsWith('language-'),
    )
    const language = languageClass?.replace('language-', '') || 'text'
    const languageLabel = languageLabelMap[language.toLowerCase()] ?? language.toUpperCase()
    const scrollArea = document.createElement('span')
    scrollArea.className = 'code-block-scroll'

    if (code) {
      block.insertBefore(scrollArea, code)
      scrollArea.append(code)
    }

    const toolbar = document.createElement('span')
    toolbar.className = 'code-block-toolbar'

    const label = document.createElement('span')
    label.className = 'code-block-language'
    label.textContent = languageLabel

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'copy-code-button'
    button.dataset.copyCodeButton = 'true'
    button.textContent = '复制'
    button.setAttribute('aria-label', '复制代码块内容')
    button.title = '复制代码'

    toolbar.append(label, button)
    block.prepend(toolbar)
  })
}

async function handleArticleClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof HTMLElement) || target.dataset.copyCodeButton !== 'true') {
    return
  }

  const block = target.closest<HTMLPreElement>('pre')
  const code = block?.querySelector('code')
  const text = code?.textContent ?? ''
  if (!text) {
    return
  }

  const originalText = target.textContent ?? '复制'

  try {
    await copyText(text.trimEnd())
    target.textContent = '已复制'
    target.classList.add('copied')
  } catch {
    target.textContent = '复制失败'
    target.classList.add('copy-failed')
  } finally {
    window.setTimeout(() => {
      target.textContent = originalText
      target.classList.remove('copied', 'copy-failed')
    }, 1500)
  }
}

async function renderMermaidBlocks() {
  await nextTick()

  const article = articleRef.value
  if (!article) {
    return
  }

  const blocks = Array.from(article.querySelectorAll<HTMLElement>('.mermaid'))
  if (blocks.length === 0) {
    return
  }

  const { default: mermaid } = await import('mermaid')
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    themeVariables: mermaidThemeVariables,
  })

  await mermaid.run({ nodes: blocks })
}

watch(
  () => note.value?.slug,
  async () => {
    await nextTick()
    enhanceCodeBlocks()
    await renderMermaidBlocks()
  },
)

onMounted(async () => {
  try {
    notes.value = await fetchNotes()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法读取笔记数据。'
  } finally {
    isLoading.value = false
    await nextTick()
    enhanceCodeBlocks()
    await renderMermaidBlocks()
  }
})
</script>

<template>
  <p v-if="isLoading" class="state-text">正在读取笔记数据。</p>
  <p v-else-if="errorMessage" class="state-text state-error">{{ errorMessage }}</p>

  <article v-else-if="note" ref="articleRef" class="note-detail" @click="handleArticleClick">
    <RouterLink class="back-link" to="/notes">返回笔记列表</RouterLink>

    <header class="note-header">
      <nav v-if="categoryCrumbs.length" class="note-breadcrumbs" aria-label="笔记路径">
        <RouterLink to="/notes">笔记</RouterLink>
        <RouterLink
          v-for="crumb in categoryCrumbs"
          :key="crumb.key"
          :to="{ path: '/notes', query: { category: crumb.key } }"
        >
          {{ crumb.label }}
        </RouterLink>
      </nav>
      <span class="note-category">{{ formatNotePath(note) }}</span>
      <h1>{{ note.title }}</h1>
      <div class="note-meta">
        <time :datetime="note.updatedAt">更新于 {{ formatDate(note.updatedAt) }}</time>
        <span>{{ note.sourceRelativePath }}</span>
      </div>
    </header>

    <div class="note-layout">
      <div class="note-content">
        <section v-if="note.introHtml" class="note-intro" aria-label="笔记概述">
          <p class="note-intro-label">概述</p>
          <div class="note-intro-body note-body" v-html="note.introHtml"></div>
        </section>

        <div class="note-body" v-html="note.html"></div>
      </div>

      <nav v-if="note.headings.length" class="toc" aria-label="文章目录">
        <a v-for="heading in note.headings" :key="heading.id" :href="`#${heading.id}`" :class="`depth-${heading.depth}`">
          {{ heading.text }}
        </a>
      </nav>
    </div>

    <nav v-if="previousNote || nextNote" class="note-page-nav" aria-label="相邻笔记">
      <RouterLink
        v-if="previousNote"
        class="note-page-link note-page-link-previous"
        :to="`/notes/${encodeNoteSlug(previousNote.slug)}`"
      >
        <span class="note-page-link-label">上一篇</span>
        <strong>{{ previousNote.title }}</strong>
        <span>{{ formatNotePath(previousNote) }}</span>
      </RouterLink>
      <span v-else class="note-page-link-placeholder" aria-hidden="true"></span>

      <RouterLink
        v-if="nextNote"
        class="note-page-link note-page-link-next"
        :to="`/notes/${encodeNoteSlug(nextNote.slug)}`"
      >
        <span class="note-page-link-label">下一篇</span>
        <strong>{{ nextNote.title }}</strong>
        <span>{{ formatNotePath(nextNote) }}</span>
      </RouterLink>
    </nav>
  </article>

  <section v-else class="page-heading">
    <p class="eyebrow">Not found</p>
    <h1>没有找到这篇笔记</h1>
    <p>当前路径没有匹配到已生成的笔记数据。</p>
    <RouterLink class="button button-primary" to="/notes">返回笔记列表</RouterLink>
  </section>
</template>
