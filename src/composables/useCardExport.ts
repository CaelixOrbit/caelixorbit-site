import html2canvas from 'html2canvas'

const EXPORT_SCALE = 4

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

function createExportClone(el: HTMLElement, rect: DOMRect): HTMLElement {
  const clone = el.cloneNode(true) as HTMLElement

  clone.classList.add('card-export-clone')
  Object.assign(clone.style, {
    position: 'fixed',
    inset: 'auto',
    top: '0',
    left: '-10000px',
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transform: 'none',
    backfaceVisibility: 'visible',
    webkitBackfaceVisibility: 'visible',
  })

  return clone
}

function downloadPng(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a')

  link.download = `${filename}.png`
  link.href = canvas.toDataURL('image/png')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function useCardExport() {
  async function exportCard(el: HTMLElement, filename: string): Promise<void> {
    const rect = el.getBoundingClientRect()
    const clone = createExportClone(el, rect)

    document.body.append(clone)
    await waitForPaint()

    try {
      const canvas = await html2canvas(clone, {
        scale: EXPORT_SCALE,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        width: rect.width,
        height: rect.height,
        windowWidth: Math.ceil(rect.width),
        windowHeight: Math.ceil(rect.height),
      })

      downloadPng(canvas, filename)
    } finally {
      clone.remove()
    }
  }

  return { exportCard }
}
