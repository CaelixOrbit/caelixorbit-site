<script setup lang="ts">
import { useFlippableCard } from '@/composables/useFlippableCard'

const {
  isFlipped,
  frontRef: cardFrontRef,
  backRef: cardBackRef,
  toggleFlip,
  exportCurrentSide,
} = useFlippableCard({
  filename: (side) => `Caelix-名片${side === 'back' ? '反面' : '正面'}`,
})

async function handleExport() {
  await exportCurrentSide()
}
</script>

<template>
  <section class="identity-page">
    <div class="identity-hero">
      <p class="eyebrow">Hidden Profile</p>
      <h1>Caelix / CLX</h1>
      <p>
        收纳身份的详细设定信息的隐藏页。
      </p>
    </div>

    <div class="identity-detail-layout">
      <!-- 翻转卡片容器 -->
      <div class="card-flip-container" :class="{ flipped: isFlipped }">
        <div class="card-flip-inner">
          <!-- 正面：详细名片 -->
          <article ref="cardFrontRef" class="identity-card no-stars card-front" data-card-kind="detailed" aria-label="Caelix 完整档案名片正面">
            <div class="card-top">
              <span class="card-kicker">Personal Profile</span>
              <span class="card-code">CLX</span>
            </div>
            <h3 class="card-name">Caelix</h3>
            <p class="tagline">Light and luck in a quiet orbit.</p>
            <div class="card-details">
              <div class="card-line"></div>
              <div class="detail-row"><span>Name / 姓名</span><strong>Caelix，简写 CLX</strong></div>
              <div class="detail-row"><span>Etymology / 词源</span><strong>Caelum 星空 / 宇宙 + Felix 幸运 / 幸福</strong></div>
              <div class="detail-row"><span>Birthday / 诞生日</span><strong>May 16 · International Day of Light</strong></div>
              <div class="detail-row"><span>Contact / 联系</span><a class="card-link" href="mailto:caelixorbit@gmail.com">caelixorbit@gmail.com</a></div>
              <div class="detail-row"><span>Website / 主页</span><RouterLink class="card-link" to="/">CaelixOrbit.space</RouterLink></div>
            </div>
          </article>

          <!-- 反面：品牌装饰面 -->
          <article ref="cardBackRef" class="identity-card no-stars card-back card-back-starry" data-card-kind="detailed" aria-label="Caelix 名片反面">
            <!-- 内嵌装饰线 -->
            <span class="card-back-rule" aria-hidden="true"></span>
            <!-- 装饰轨道环 -->
            <span class="card-back-orbit" aria-hidden="true"></span>
            <svg class="card-back-star-field" viewBox="0 0 856 540" aria-hidden="true" focusable="false">
              <defs>
                <radialGradient id="star-white-soft">
                  <stop offset="0%" stop-color="#f8fbff" stop-opacity="0.9" />
                  <stop offset="34%" stop-color="#f8fbff" stop-opacity="0.45" />
                  <stop offset="72%" stop-color="#f8fbff" stop-opacity="0.12" />
                  <stop offset="100%" stop-color="#f8fbff" stop-opacity="0" />
                </radialGradient>
                <radialGradient id="star-cyan-soft">
                  <stop offset="0%" stop-color="#76dcff" stop-opacity="0.78" />
                  <stop offset="36%" stop-color="#76dcff" stop-opacity="0.36" />
                  <stop offset="74%" stop-color="#76dcff" stop-opacity="0.1" />
                  <stop offset="100%" stop-color="#76dcff" stop-opacity="0" />
                </radialGradient>
                <radialGradient id="star-gold-soft">
                  <stop offset="0%" stop-color="#f7d878" stop-opacity="0.72" />
                  <stop offset="36%" stop-color="#f7d878" stop-opacity="0.32" />
                  <stop offset="74%" stop-color="#f7d878" stop-opacity="0.1" />
                  <stop offset="100%" stop-color="#f7d878" stop-opacity="0" />
                </radialGradient>
                <radialGradient id="star-cyan-glow">
                  <stop offset="0%" stop-color="#76dcff" stop-opacity="0.28" />
                  <stop offset="62%" stop-color="#76dcff" stop-opacity="0.08" />
                  <stop offset="100%" stop-color="#76dcff" stop-opacity="0" />
                </radialGradient>
                <radialGradient id="star-gold-glow">
                  <stop offset="0%" stop-color="#f7d878" stop-opacity="0.24" />
                  <stop offset="62%" stop-color="#f7d878" stop-opacity="0.07" />
                  <stop offset="100%" stop-color="#f7d878" stop-opacity="0" />
                </radialGradient>
              </defs>
              <circle class="star-soft" fill="url(#star-white-soft)" cx="38" cy="88" r="4.1" />
              <circle class="star-soft" fill="url(#star-cyan-soft)" cx="76" cy="244" r="3.7" />
              <!-- <circle class="star-soft" fill="url(#star-gold-soft)" cx="116" cy="168" r="4" /> -->
              <!-- <circle class="star-soft" fill="url(#star-white-soft)" cx="154" cy="62" r="5.2" /> -->
              <circle class="star-soft" fill="url(#star-cyan-soft)" cx="196" cy="338" r="4.4" />
              <!-- <circle class="star-soft" fill="url(#star-white-soft)" cx="248" cy="232" r="3.7" /> -->
              <circle class="star-soft" fill="url(#star-gold-soft)" cx="292" cy="112" r="4.1" />
              <!-- <circle class="star-soft" fill="url(#star-white-soft)" cx="336" cy="408" r="3.4" /> -->
              <circle class="star-soft" fill="url(#star-white-soft)" cx="522" cy="76" r="5.6" />
              <!-- <circle class="star-soft" fill="url(#star-cyan-soft)" cx="566" cy="382" r="4.2" /> -->
              <circle class="star-soft" fill="url(#star-white-soft)" cx="614" cy="196" r="3.6" />
              <circle class="star-soft" fill="url(#star-gold-soft)" cx="658" cy="296" r="4.6" />
              <!-- <circle class="star-soft" fill="url(#star-cyan-soft)" cx="704" cy="94" r="4.4" /> -->
              <circle class="star-soft" fill="url(#star-white-soft)" cx="746" cy="232" r="4" />
              <circle class="star-soft" fill="url(#star-cyan-soft)" cx="786" cy="388" r="3.7" />
              <!-- <circle class="star-soft" fill="url(#star-gold-soft)" cx="816" cy="162" r="4.2" /> -->
              <!-- <circle class="star-glow" fill="url(#star-cyan-glow)" cx="232" cy="456" r="34" /> -->
              <!-- <circle class="star-glow" fill="url(#star-gold-glow)" cx="764" cy="74" r="38" /> -->
            </svg>
            <div class="card-back-body">
              <span class="card-back-monogram">CLX</span>
              <p class="card-back-tagline">Light and luck in a quiet orbit.</p>
              <div class="card-back-divider" aria-hidden="true"></div>
              <p class="card-back-categories">
                <span>Amateur Radio</span>
                <span class="card-back-callsign">BG6HXS</span>
              </p>
              <RouterLink class="card-back-url" to="/">CaelixOrbit.space</RouterLink>
            </div>
          </article>
        </div>

        <button class="card-flip-control" type="button" @click="toggleFlip">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M17 1l4 4-4 4" />
            <path d="M3 11V9a4 4 0 014-4h14" />
            <path d="M7 23l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 01-4 4H3" />
          </svg>
          <span>{{ isFlipped ? '翻回正面' : '翻到反面' }}</span>
        </button>
        <button class="card-flip-control" type="button" @click="handleExport">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>导出卡片</span>
        </button>
      </div>
    </div>
  </section>
</template>
