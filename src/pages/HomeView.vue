<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
let identitySignalCount = 0
let identitySignalTimer: number | undefined

function handleIdentitySignal() {
  identitySignalCount += 1

  if (identitySignalTimer !== undefined) {
    window.clearTimeout(identitySignalTimer)
  }

  identitySignalTimer = window.setTimeout(() => {
    identitySignalCount = 0
  }, 1800)

  if (identitySignalCount >= 5) {
    identitySignalCount = 0
    window.clearTimeout(identitySignalTimer)
    identitySignalTimer = undefined
    void router.push('/identity')
  }
}

onBeforeUnmount(() => {
  if (identitySignalTimer !== undefined) {
    window.clearTimeout(identitySignalTimer)
  }
})
</script>

<template>
  <section class="hero-section">
    <div class="hero-copy">
      <p class="eyebrow">Personal Profile · Today I Learned</p>
      <div>
        <h1>Caelix</h1>
        <p class="tagline">Light and luck in a quiet orbit.</p>
      </div>
      <p class="hero-text">Caelix 的个人主页，放置 Today-I-Learned 笔记，以及联系方式。</p>

    </div>

    <div class="hero-visual">
      <div class="orbit-system">
        <svg class="orbit-lines" viewBox="0 0 440 440" focusable="false" aria-hidden="true">
          <defs>
            <path id="orbit-outer" d="M405 220A185 118 0 1 1 35 220A185 118 0 1 1 405 220" />
            <path id="orbit-inner" d="M384 220A164 104 0 1 1 56 220A164 104 0 1 1 384 220" />
          </defs>
          <g transform="rotate(-16 220 220)">
            <use href="#orbit-outer" class="orbit-stroke orbit-cyan" />
            <circle r="5.5" class="orbit-dot dot-gold">
              <animateMotion dur="18s" repeatCount="indefinite" rotate="auto">
                <mpath href="#orbit-outer" />
              </animateMotion>
            </circle>
          </g>
          <g transform="rotate(28 220 220)">
            <use href="#orbit-inner" class="orbit-stroke orbit-gold" />
            <circle r="5" class="orbit-dot dot-cyan">
              <animateMotion dur="24s" repeatCount="indefinite" rotate="auto">
                <mpath href="#orbit-inner" />
              </animateMotion>
            </circle>
          </g>
        </svg>
        <button class="core core-secret" type="button" aria-label="CLX 视觉标识" @click="handleIdentitySignal">
          <span class="core-content">
            <span class="core-title">CLX</span>
            <span class="core-kicker">LIGHT / LUCK</span>
          </span>
        </button>
      </div>
    </div>
  </section>
</template>
