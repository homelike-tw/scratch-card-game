<script setup lang="ts">
import { ref, onMounted, watch, nextTick, defineExpose } from 'vue'

interface Props {
  width?: number
  height?: number
  coverColor?: string
  scratchRadius?: number
  revealPercent?: number
  disabled?: boolean
  /** 解鎖時是否自動重置遮罩（避免上次殘留） */
  resetOnUnlock?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: 320,
  height: 200,
  coverColor: '#bdbdbd',
  scratchRadius: 22,
  revealPercent: 55,
  disabled: false,
  resetOnUnlock: true
})

const emit = defineEmits<{
  (e: 'revealed'): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let isDrawing = false
let scratchCount = 0
let revealed = false

const drawSilverMask = () => {
  if (!ctx) return

  const w = props.width
  const h = props.height

  // 主銀色底（左深 → 右淺）
  const base = ctx.createLinearGradient(0, 0, w, 0)
  base.addColorStop(0.0, '#b9b7b4')
  base.addColorStop(0.4, '#d6d5d2')
  base.addColorStop(0.6, '#eeeeee')
  base.addColorStop(1.0, '#c9c7c4')

  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  // 斜向高光
  ctx.save()
  ctx.globalAlpha = 0.45
  const shine = ctx.createLinearGradient(-w * 0.2, 0, w * 1.2, h)
  shine.addColorStop(0.35, 'rgba(255,255,255,0)')
  shine.addColorStop(0.48, 'rgba(255,255,255,0.85)')
  shine.addColorStop(0.52, 'rgba(255,255,255,0.85)')
  shine.addColorStop(0.65, 'rgba(255,255,255,0)')
  ctx.fillStyle = shine
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // 極淡陰影，增加金屬厚度感
  ctx.save()
  ctx.globalAlpha = 0.08
  const shadow = ctx.createLinearGradient(0, 0, 0, h)
  shadow.addColorStop(0, '#000000')
  shadow.addColorStop(0.5, 'rgba(0,0,0,0)')
  shadow.addColorStop(1, '#000000')
  ctx.fillStyle = shadow
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

const initCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.floor(props.width * dpr)
  canvas.height = Math.floor(props.height * dpr)
  canvas.style.width = props.width + 'px'
  canvas.style.height = props.height + 'px'

  ctx = canvas.getContext('2d')
  if (!ctx) return

  // 用 CSS 尺寸當座標系
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // 畫遮罩
  ctx.globalCompositeOperation = 'source-over'
  drawSilverMask()

  // 刮除模式
  ctx.globalCompositeOperation = 'destination-out'

  scratchCount = 0
  revealed = false
}

const getPos = (e: PointerEvent) => {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

const scratch = (e: PointerEvent) => {
  if (!ctx || revealed || props.disabled) return
  const { x, y } = getPos(e)

  ctx.beginPath()
  ctx.arc(x, y, props.scratchRadius, 0, Math.PI * 2)
  ctx.fill()

  scratchCount++
  if (scratchCount % 10 === 0) checkReveal()
}

const checkReveal = () => {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return

  // 注意：這裡讀的是「實際像素」尺寸 (canvas.width/height)
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = img.data
  const total = pixels.length / 4
  let transparent = 0

  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] === 0) transparent++
  }

  const percent = (transparent / total) * 100
  if (percent >= props.revealPercent) revealAll()
}

const revealAll = () => {
  if (!ctx) return
  ctx.clearRect(0, 0, props.width, props.height)
  revealed = true
  emit('revealed')
}

// Pointer events
const onDown = (e: PointerEvent) => {
  if (revealed || props.disabled) return
  isDrawing = true
  canvasRef.value?.setPointerCapture(e.pointerId)
  scratch(e)
}

const onMove = (e: PointerEvent) => {
  if (!isDrawing || revealed || props.disabled) return
  scratch(e)
}

const onUp = (e: PointerEvent) => {
  isDrawing = false
  try {
    canvasRef.value?.releasePointerCapture(e.pointerId)
  } catch {
    // 某些瀏覽器/情況下可能沒有 capture，忽略即可
  }
  checkReveal()
}

const onLeave = () => {
  isDrawing = false
}

/** 給外層呼叫：重置刮刮樂 */
const reset = async () => {
  await nextTick()
  initCanvas()
}

defineExpose({ reset, revealAll })

onMounted(() => {
  initCanvas()
})

/** 解鎖時重新初始化遮罩，避免之前狀態殘留 */
watch(
  () => props.disabled,
  (d, prev) => {
    if (prev === true && d === false && props.resetOnUnlock) {
      initCanvas()
    }
  }
)

/** 尺寸變更時，必須重建 canvas 像素尺寸 */
watch(
  () => [props.width, props.height],
  () => {
    initCanvas()
  }
)
</script>

<template>
  <div class="wrapper" :style="{ width: props.width + 'px', height: props.height + 'px' }">
   >

    <canvas
      ref="canvasRef"
      class="mask"
      :class="{ locked: props.disabled }"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @pointerleave="onLeave"
    />
  </div>
</template>

<style scoped>
.wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  display: inline-block;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}

.content {
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mask {
  position: absolute;
  inset: 0;
  touch-action: none;
  cursor: grab;
}
.mask:active {
  cursor: grabbing;
}
.mask.locked {
  cursor: not-allowed;
}
</style>
