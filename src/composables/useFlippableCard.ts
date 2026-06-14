import { ref } from 'vue'

import { useCardExport } from '@/composables/useCardExport'

type CardSide = 'front' | 'back'

interface UseFlippableCardOptions {
  filename: (side: CardSide) => string
}

export function useFlippableCard({ filename }: UseFlippableCardOptions) {
  const { exportCard } = useCardExport()
  const isFlipped = ref(false)
  const frontRef = ref<HTMLElement | null>(null)
  const backRef = ref<HTMLElement | null>(null)

  function toggleFlip() {
    isFlipped.value = !isFlipped.value
  }

  async function exportCurrentSide() {
    const side: CardSide = isFlipped.value ? 'back' : 'front'
    const el = isFlipped.value ? backRef.value : frontRef.value

    if (!el) {
      return
    }

    await exportCard(el, filename(side))
  }

  return {
    isFlipped,
    frontRef,
    backRef,
    toggleFlip,
    exportCurrentSide,
  }
}
