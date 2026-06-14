<script setup lang="ts">
import { useFlippableCard } from '@/composables/useFlippableCard'

const {
  isFlipped: isCompactFlipped,
  frontRef: compactFrontRef,
  backRef: compactBackRef,
  toggleFlip: toggleCompactFlip,
  exportCurrentSide: exportCompactCard,
} = useFlippableCard({
  filename: (side) => `Caelix-名片${side === 'back' ? '反面' : '正面'}`,
})

const {
  isFlipped: isQslFlipped,
  frontRef: qslFrontRef,
  backRef: qslBackRef,
  toggleFlip: toggleQslFlip,
  exportCurrentSide: exportQslCard,
} = useFlippableCard({
  filename: (side) => `QSL-BG6HXS-${side === 'back' ? '反面' : '正面'}`,
})

async function handleExportCompact() {
  await exportCompactCard()
}

async function handleExportQsl() {
  await exportQslCard()
}
</script>

<template>
  <section class="contact-page">
    <div class="page-heading">
      <p class="eyebrow">Contact</p>
      <h1>联系</h1>
      <p>公开联系方式和 BG6HXS QSL 卡片。</p>
    </div>

    <section class="contact-card-stack" aria-label="公开联系卡片和 BG6HXS QSL 卡片">
      <div class="qsl-card-row">
        <!-- 左：简略名片（可翻转） -->
        <div class="card-block">
          <div class="card-flip-container" :class="{ flipped: isCompactFlipped }">
            <div class="card-flip-inner">
              <article ref="compactFrontRef" class="identity-card compact no-stars card-front" data-card-kind="compact" aria-label="Caelix 简略联系名片正面">
                <div class="card-top">
                  <span class="card-kicker">Personal Profile</span>
                  <span class="card-code">CLX</span>
                </div>
                <h3 class="card-name">Caelix</h3>
                <div class="card-details">
                  <div class="card-line"></div>
                  <div class="detail-row"><span>Name / 姓名</span><strong>Caelix / CLX</strong></div>
                  <div class="detail-row"><span>Contact / 联系</span><a class="card-link" href="mailto:caelixorbit@gmail.com">caelixorbit@gmail.com</a></div>
                  <div class="detail-row"><span>Website / 主页</span><RouterLink class="card-link" to="/">CaelixOrbit.space</RouterLink></div>
                </div>
              </article>

              <article ref="compactBackRef" class="identity-card compact no-stars card-back card-back-compact" data-card-kind="compact" aria-label="Caelix 简略名片反面">
                <span class="card-back-rule" aria-hidden="true"></span>
                <span class="card-back-orbit" aria-hidden="true"></span>
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

            <button class="card-flip-control" type="button" @click="toggleCompactFlip">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M17 1l4 4-4 4" />
                <path d="M3 11V9a4 4 0 014-4h14" />
                <path d="M7 23l-4-4 4-4" />
                <path d="M21 13v2a4 4 0 01-4 4H3" />
              </svg>
              <span>{{ isCompactFlipped ? '翻回正面' : '翻到反面' }}</span>
            </button>
            <button class="card-flip-control" type="button" @click="handleExportCompact">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>导出名片</span>
            </button>
          </div>
        </div>

        <!-- 右：QSL 卡片（可翻转） -->
        <div class="card-block">
          <div class="card-flip-container" :class="{ flipped: isQslFlipped }">
            <div class="card-flip-inner">
              <article ref="qslFrontRef" class="qsl-card front card-front" aria-label="BG6HXS QSL card 正面">
                <div class="front-copy">
                  <div>
                    <p class="kicker">QSL Card</p>
                    <h2 class="callsign">BG6HXS</h2>
                    <p class="tagline">Light and luck in a quiet orbit.</p>
                  </div>
                  <div class="qsl-identity">
                    <svg class="crac-mark" viewBox="0 0 72 116" role="img" aria-label="CRAC">
                      <path d="M36 4 L63 54 L36 112 L9 54 Z" fill="none" stroke="#76dcff" stroke-width="4" />
                      <path d="M36 14 L36 94 M24 88 H48 M20 76 H52" fill="none" stroke="#76dcff" stroke-width="3" stroke-linecap="round" />
                      <circle cx="36" cy="55" r="18" fill="none" stroke="#f7d878" stroke-width="2" />
                      <path d="M21 58 C30 48 42 48 51 58" fill="none" stroke="#f8fbff" stroke-width="2.4" stroke-linecap="round" />
                      <text x="36" y="60" text-anchor="middle" fill="#f8fbff" font-size="14" font-weight="900" font-family="Inter, Segoe UI, sans-serif">中国</text>
                      <path d="M19 66 L53 66 L49 79 L23 79 Z" fill="#0d1d30" stroke="#76dcff" stroke-width="2" />
                      <text x="36" y="76" text-anchor="middle" fill="#76dcff" font-size="10" font-weight="900" font-family="Inter, Segoe UI, sans-serif">CRAC</text>
                    </svg>
                    <div class="identity-lines">
                      <p><strong>Caelix</strong> / CLX</p>
                      <p><RouterLink to="/">CaelixOrbit.space</RouterLink></p>
                      <p><a href="mailto:caelixorbit@gmail.com">caelixorbit@gmail.com</a></p>
                    </div>
                  </div>
                </div>
              </article>

              <article ref="qslBackRef" class="qsl-card back card-flip-back" aria-label="BG6HXS QSL card 反面">
                <div class="back-head">
                  <div class="back-title">
                    <h2>Personal Amateur Radio Station of P.R.China</h2>
                  </div>
                  <div class="to-radio-box">To Radio</div>
                </div>

                <div class="confirm-row">
                  <strong>Confirming</strong>
                  <span class="check"><i class="box"></i>Our QSO</span>
                  <span class="check"><i class="box"></i>Your SWL Report</span>
                  <span class="check"><i class="box"></i>Eyeball QSO</span>
                </div>

                <div class="qso-grid">
                  <div class="field date"><span>Date / 日期</span><div class="field-value">&nbsp;</div><div class="write-line"></div></div>
                  <div class="field time"><span>Time / 时间</span><div class="field-value">&nbsp;</div><div class="write-line"></div></div>
                  <div class="field band"><span>Freq / 频率</span><div class="field-value">&nbsp;</div><div class="write-line"></div></div>
                  <div class="field mode"><span>Mode / 模式</span><div class="field-value">&nbsp;</div><div class="write-line"></div></div>
                  <div class="field rst"><span>RST / 信号</span><div class="field-value">&nbsp;</div><div class="write-line"></div></div>
                  <div class="field rig"><span>Rig / 设备</span><div class="field-value">&nbsp;</div><div class="write-line"></div></div>
                  <div class="field pwr"><span>PWR / 功率</span><div class="field-value">&nbsp;</div><div class="write-line"></div></div>
                  <div class="field ant"><span>ANT / 天线</span><div class="field-value">&nbsp;</div><div class="write-line"></div></div>
                  <div class="field wx"><span>WX / 天气</span><div class="field-value">&nbsp;</div><div class="write-line"></div></div>
                  <div class="field op"><span>OP</span><div class="field-value">&nbsp;</div><div class="write-line"></div></div>
                  <div class="field remarks"><span>RMKS / 备注</span><div class="field-value">&nbsp;</div><div class="write-line"></div></div>
                </div>

                <div class="back-foot">
                  <div>
                    <div class="checks">
                      <span><i class="box"></i>TNX QSL</span>
                      <span><i class="box"></i>PSE QSL</span>
                    </div>
                    <p>CaelixOrbit.space · caelixorbit@gmail.com</p>
                  </div>
                  <div class="signature">73 from <span>BG6HXS</span></div>
                </div>
              </article>
            </div>

            <button class="card-flip-control" type="button" @click="toggleQslFlip">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M17 1l4 4-4 4" />
                <path d="M3 11V9a4 4 0 014-4h14" />
                <path d="M7 23l-4-4 4-4" />
                <path d="M21 13v2a4 4 0 01-4 4H3" />
              </svg>
              <span>{{ isQslFlipped ? '翻回正面' : '翻到反面' }}</span>
            </button>
            <button class="card-flip-control qsl-export-pending" type="button" disabled @click="handleExportQsl">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>监修中</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>
