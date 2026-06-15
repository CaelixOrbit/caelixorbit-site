<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { NoteItem } from '@/types/notes'
import {
  categoryPathKey,
  encodeNoteSlug,
  fetchNotes,
  formatDate,
  formatNotePath,
  getNoteCategoryPath,
} from '@/utils/notes'

interface CategoryOption {
  kind: 'category' | 'note'
  key: string
  label: string
  labelHtml: string
  fullLabel: string
  depth: number
  count?: number
  children: CategoryOption[]
  noteSlug?: string
}

const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 10

const notes = ref<NoteItem[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const expandedCategoryKeys = ref<Set<string>>(new Set())

const activeCategory = computed(() => {
  const value = route.query.category
  return typeof value === 'string' ? value : ''
})

const categoryTree = computed(() => {
  const options = new Map<string, CategoryOption>()
  const roots: CategoryOption[] = []

  notes.value.forEach((note) => {
    const segments = getNoteCategoryPath(note)

    segments.forEach((label, index) => {
      const pathSegments = segments.slice(0, index + 1)
      const parentKey = categoryPathKey(pathSegments.slice(0, index))
      const key = categoryPathKey(pathSegments)

      if (!options.has(key)) {
        const option: CategoryOption = {
          kind: 'category',
          key,
          label,
          labelHtml: label,
          fullLabel: pathSegments.join(' / '),
          depth: index + 1,
          count: 0,
          children: [],
        }

        options.set(key, option)

        if (parentKey) {
          options.get(parentKey)?.children.push(option)
        } else {
          roots.push(option)
        }
      }

      const option = options.get(key)
      if (option) {
        option.count = (option.count ?? 0) + 1
      }
    })

    const parentKey = categoryPathKey(segments)
    const noteKey = `note:${note.slug}`
    const notePathLabel = segments.length ? `${segments.join(' / ')} / ${note.title}` : note.title

    if (!options.has(noteKey)) {
      const option: CategoryOption = {
        kind: 'note',
        key: noteKey,
        label: note.title,
        labelHtml: note.titleHtml,
        fullLabel: notePathLabel,
        depth: segments.length + 1,
        children: [],
        noteSlug: note.slug,
      }

      options.set(noteKey, option)

      if (parentKey) {
        options.get(parentKey)?.children.push(option)
      } else {
        roots.push(option)
      }
    }
  })

  const sortNodes = (nodes: CategoryOption[]) => {
    nodes.sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === 'category' ? -1 : 1
      }

      return left.label.localeCompare(right.label, 'zh-CN', { numeric: true })
    })
    nodes.forEach((node) => sortNodes(node.children))
    return nodes
  }

  return sortNodes(roots)
})

const visibleCategories = computed(() => {
  const flattened: CategoryOption[] = []

  const appendVisibleNodes = (nodes: CategoryOption[]) => {
    nodes.forEach((node) => {
      flattened.push(node)

      if (expandedCategoryKeys.value.has(node.key)) {
        appendVisibleNodes(node.children)
      }
    })
  }

  appendVisibleNodes(categoryTree.value)
  return flattened
})

const filteredNotes = computed(() => {
  if (!activeCategory.value) {
    return notes.value
  }

  return notes.value.filter((note) => {
    const key = categoryPathKey(getNoteCategoryPath(note))
    return key === activeCategory.value || key.startsWith(`${activeCategory.value}/`)
  })
})

const currentPage = computed(() => {
  const raw = route.query.page
  if (typeof raw !== 'string') return 1
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 1) return 1
  return n
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredNotes.value.length / PAGE_SIZE)))

const validatedPage = computed(() => Math.min(currentPage.value, totalPages.value))

const pagedNotes = computed(() => {
  const start = (validatedPage.value - 1) * PAGE_SIZE
  return filteredNotes.value.slice(start, start + PAGE_SIZE)
})

interface PageLink {
  label: string
  page: number
  current: boolean
  disabled: boolean
  kind: 'prev' | 'next' | 'page' | 'gap'
}

const paginationLinks = computed<PageLink[]>(() => {
  const total = totalPages.value
  const current = validatedPage.value
  const links: PageLink[] = []

  links.push({
    label: '上一页',
    page: current - 1,
    current: false,
    disabled: current <= 1,
    kind: 'prev',
  })

  const maxVisible = 7
  let startPage: number
  let endPage: number

  if (total <= maxVisible) {
    startPage = 1
    endPage = total
  } else {
    const half = Math.floor(maxVisible / 2)
    if (current <= half + 1) {
      startPage = 1
      endPage = maxVisible - 1
    } else if (current >= total - half) {
      startPage = total - maxVisible + 2
      endPage = total
    } else {
      startPage = current - half + 1
      endPage = current + half - 1
    }
  }

  if (startPage > 1) {
    links.push({ label: '1', page: 1, current: false, disabled: false, kind: 'page' })
    if (startPage > 2) {
      links.push({ label: '…', page: 0, current: false, disabled: true, kind: 'gap' })
    }
  }

  for (let p = startPage; p <= endPage; p++) {
    links.push({
      label: String(p),
      page: p,
      current: p === current,
      disabled: false,
      kind: 'page',
    })
  }

  if (endPage < total) {
    if (endPage < total - 1) {
      links.push({ label: '…', page: 0, current: false, disabled: true, kind: 'gap' })
    }
    links.push({ label: String(total), page: total, current: false, disabled: false, kind: 'page' })
  }

  links.push({
    label: '下一页',
    page: current + 1,
    current: false,
    disabled: current >= total,
    kind: 'next',
  })

  return links
})

const recentNotes = computed(() => notes.value.slice(0, 4))

async function setCategory(category: string) {
  await router.push({
    path: '/notes',
    query: category ? { category } : {},
  })
}

async function goToPage(page: number) {
  const total = totalPages.value
  const clamped = Math.max(1, Math.min(page, total))
  const query: Record<string, string> = {}
  if (activeCategory.value) {
    query.category = activeCategory.value
  }
  if (clamped > 1) {
    query.page = String(clamped)
  }
  await router.push({ path: '/notes', query })
}

function expandCategory(category: string) {
  const nextExpanded = new Set(expandedCategoryKeys.value)
  const segments = category.split('/').filter(Boolean)

  segments.forEach((_, index) => {
    nextExpanded.add(categoryPathKey(segments.slice(0, index + 1)))
  })

  expandedCategoryKeys.value = nextExpanded
}

function isCategoryExpanded(category: string) {
  return expandedCategoryKeys.value.has(category)
}

function toggleCategory(category: string) {
  const nextExpanded = new Set(expandedCategoryKeys.value)

  if (nextExpanded.has(category)) {
    nextExpanded.delete(category)
  } else {
    nextExpanded.add(category)
  }

  expandedCategoryKeys.value = nextExpanded
}

async function selectCategory(category: CategoryOption) {
  if (category.kind === 'note' && category.noteSlug) {
    await router.push(`/notes/${encodeNoteSlug(category.noteSlug)}`)
    return
  }

  if (category.children.length) {
    expandCategory(category.key)
  }

  await setCategory(category.key)
}

watch(
  () => activeCategory.value,
  (category) => {
    if (category) {
      expandCategory(category)
    }
  },
  { immediate: true },
)

watch(
  () => currentPage.value,
  (page) => {
    const total = totalPages.value
    if (page > total) {
      goToPage(total)
    }
  },
)

onMounted(async () => {
  try {
    notes.value = await fetchNotes()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法读取笔记数据。'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <section class="page-heading">
    <p class="eyebrow">Today-I-Learned</p>
    <h1>笔记</h1>
    <p>内容来自 <a href="https://github.com/CaelixOrbit/Today-I-Learned" target="_blank" rel="noreferrer" class="til-link"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg><span style="margin-left:4px">Today-I-Learned</span></a>，随站点构建脚本自动发布为静态页面。</p>
    <p>PS：说是 <del>Today-I-Learned</del>，实际上目前是在 <del>整理以前的笔记</del> _(:з」∠)_</p>
  </section>

  <section class="notes-layout">
    <aside class="category-panel" aria-label="笔记分类">
      <button
        class="category-button category-root"
        :class="{ active: !activeCategory }"
        type="button"
        @click="setCategory('')"
      >
        <span class="category-label">全部</span>
        <span class="category-count">{{ notes.length }}</span>
      </button>

      <div class="category-tree" aria-label="文件夹式分类">
        <div
          v-for="category in visibleCategories"
          :key="category.key"
          class="category-tree-row"
          :class="[
            { open: category.kind === 'category' && isCategoryExpanded(category.key), leaf: category.kind === 'note' },
            `depth-${Math.min(category.depth, 4)}`,
          ]"
          :style="{ '--category-depth': category.depth - 1 }"
        >
          <button
            v-if="category.kind === 'category' && category.children.length"
            class="category-toggle"
            type="button"
            :aria-label="`${isCategoryExpanded(category.key) ? '收起' : '展开'} ${category.fullLabel}`"
            :aria-expanded="isCategoryExpanded(category.key)"
            @click="toggleCategory(category.key)"
          >
            <span class="category-chevron" aria-hidden="true"></span>
          </button>
          <span v-else class="category-toggle category-toggle-placeholder" aria-hidden="true">
            <span class="category-leaf-dot"></span>
          </span>

          <button
            class="category-button category-tree-item"
            :class="{
              active: category.kind === 'category' && activeCategory === category.key,
              folder: category.kind === 'category',
              leaf: category.kind === 'note',
              open: category.kind === 'category' && isCategoryExpanded(category.key),
            }"
            type="button"
            :title="category.fullLabel"
            @click="selectCategory(category)"
          >
            <span class="category-folder-icon" aria-hidden="true"></span>
            <span class="category-label"><span v-html="category.labelHtml"></span></span>
            <span v-if="category.kind === 'category'" class="category-count">{{ category.count }}</span>
          </button>
        </div>
      </div>

      <div v-if="!isLoading && !errorMessage && recentNotes.length" class="category-panel-recent">
        <h3 class="category-panel-recent-title">最近笔记</h3>
        <RouterLink
          v-for="note in recentNotes"
          :key="note.slug"
          class="category-panel-recent-item"
          :to="`/notes/${encodeNoteSlug(note.slug)}`"
        >
          <span v-html="note.titleHtml"></span>
        </RouterLink>
      </div>

      <a class="category-panel-gh-link" href="https://github.com/CaelixOrbit/Today-I-Learned" target="_blank" rel="noreferrer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
        </svg>
        Today-I-Learned
      </a>
    </aside>

    <div class="notes-main">
      <div class="notes-list" aria-live="polite">
        <p v-if="isLoading" class="state-text">正在读取笔记数据。</p>
        <p v-else-if="errorMessage" class="state-text state-error">{{ errorMessage }}</p>
        <p v-else-if="filteredNotes.length === 0" class="state-text">当前分类还没有笔记。</p>

        <RouterLink
          v-for="note in pagedNotes"
          v-else
          :key="note.slug"
          class="note-row"
          :to="`/notes/${encodeNoteSlug(note.slug)}`"
        >
          <span class="note-category">{{ note.category }}</span>
          <h2><span v-html="note.titleHtml"></span></h2>
          <span class="note-path">{{ formatNotePath(note) }}</span>
          <p>{{ note.summary }}</p>
          <time :datetime="note.updatedAt">{{ formatDate(note.updatedAt) }}</time>
        </RouterLink>
      </div>

      <nav
        v-if="totalPages > 1"
        class="pagination"
        aria-label="分页导航"
      >
        <button
          v-for="link in paginationLinks"
          :key="`${link.kind}-${link.page}`"
          :class="[
            'pagination-item',
            `pagination-${link.kind}`,
            { 'pagination-current': link.current, 'pagination-disabled': link.disabled },
          ]"
          :disabled="link.disabled"
          :aria-current="link.current ? 'page' : undefined"
          :aria-label="link.kind === 'prev' ? '上一页' : link.kind === 'next' ? '下一页' : link.kind === 'gap' ? '更多页码' : `第 ${link.page} 页`"
          type="button"
          @click="link.kind !== 'gap' && goToPage(link.page)"
        >
          <span v-if="link.kind === 'prev'" class="pagination-chevron pagination-chevron-left" aria-hidden="true"></span>
          <span v-else-if="link.kind === 'next'" class="pagination-chevron pagination-chevron-right" aria-hidden="true"></span>
          <span v-else>{{ link.label }}</span>
        </button>
      </nav>
    </div>
  </section>
</template>
