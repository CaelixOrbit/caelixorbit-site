import type { NoteItem } from '@/types/notes'

let notesRequest: Promise<NoteItem[]> | null = null

export async function fetchNotes(): Promise<NoteItem[]> {
  if (!notesRequest) {
    notesRequest = fetch(`${import.meta.env.BASE_URL}content/notes.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('笔记数据还没有生成，请先运行 npm run notes:build。')
        }

        return response.json() as Promise<NoteItem[]>
      })
      .then((notes) =>
        [...notes].sort((left: NoteItem, right: NoteItem) =>
          left.title.localeCompare(right.title, 'zh-CN', { numeric: true }),
        ),
      )
  }

  return notesRequest
}

export function encodeNoteSlug(slug: string): string {
  return slug.split('/').map(encodeURIComponent).join('/')
}

export function routeSlugToNoteSlug(value: string | string[]): string {
  return Array.isArray(value) ? value.join('/') : value
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

export function getNoteCategoryPath(note: NoteItem): string[] {
  if (note.categoryPath?.length) {
    return note.categoryPath
  }

  return note.category ? [note.category] : []
}

export function categoryPathKey(pathSegments: string[]): string {
  return pathSegments.join('/')
}

export function formatNotePath(note: NoteItem): string {
  return note.categoryPathLabel || categoryPathKey(getNoteCategoryPath(note)) || note.category || 'Notes'
}
