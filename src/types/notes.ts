export interface NoteHeading {
  depth: number
  text: string
  id: string
}

export interface NoteItem {
  slug: string
  title: string
  category: string
  categoryPath: string[]
  categoryPathLabel: string
  tags: string[]
  summary: string
  updatedAt: string
  introHtml: string
  html: string
  headings: NoteHeading[]
  sourceRelativePath: string
}
