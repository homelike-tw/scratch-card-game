<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{
  open: boolean
  store: string
  name: string
  amount: number
}>()

const emit = defineEmits<{
  (e: "restart"): void
}>()

const amountText = computed(() => String(props.amount))
</script>

<template>
  <teleport to="body">
    <div v-if="open" class="overlay" role="dialog" aria-modal="true">
      <div class="card">
        <div class="brand">
          <div class="brand-line-1">Homelike 喜家居</div>
          <div class="meta">
          <div>
            <span class="meta-k"></span>
            <span class="meta-v">{{ store }}</span>
          </div>
          <div>
            <span class="meta-k"></span>
            <span class="meta-v">{{ name }}</span>
          </div>
        </div>
        </div>

        <div class="ticket">
          <div class="tag">現<br />折</div>

          <div class="amount">
            <span class="num">{{ amountText }}</span>
            <span class="unit">元</span>
          </div>
        </div>

        
        <div class="brand-line-2">恭喜！幸運就在你手上</div>
        <div class="actions">
          <button class="btn primary" type="button" @click="emit('restart')">
            Play again
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.card {
  width: min(860px, 96vw);
  border-radius: 44px;
  padding: 34px 34px 28px;
  background: linear-gradient(135deg, #e11616, #b10d0d 70%, #7a0a0a);
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.35);
}

.brand {
  text-align: center;
  padding: 8px 10px 18px;
}

.brand-line-1 {
  color: #f1c06a;
  font-weight: 600;
  font-size: 60px;
  letter-spacing: 1px;
}

.brand-line-2 {
  margin-top: 10px;
  color: #ffffff;
  font-weight: 400; /* normal */
  font-size: 35px;
  text-align: center;
  letter-spacing: 2px;
}


.ticket {
  margin: 18px auto 0;
  background: #ffffff;
  border-radius: 32px;
  padding: 26px 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 26px;
}

.tag {
  color: #8a8a8a;
  font-weight: 900;
  font-size: 44px;
  line-height: 1.05;
}

.amount {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.num {
  font-size: 220px;
   line-height: 0.9;
  font-weight: 1000;
  letter-spacing: 2px;
  background: linear-gradient(180deg, #ff2b2b, #8b0a0a);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.unit {
  font-size: 54px;
  font-weight: 900;
  color: #8a8a8a;
}

.meta {
  margin-top: 8px;              /* 拉開跟金額的距離 */
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  color: #fff;
  font-size: 24px;               /* 整組放大（關鍵） */
}


.meta-k {
  opacity: .9;
  font-weight: 800;
  font-size: 22px;               /* 標籤字 */
}

.meta-v {
  font-weight: 400;
  font-size: 45px;               /* 值再更大一點 */
}


.actions {
  margin-top: 18px;
  display: flex;
  justify-content: center;
}

.btn {
  border: none;
  border-radius: 999px;
  padding: 16px 32px;   /* 原本約 12 22 → 放大 */
  font-weight: 900;
  cursor: pointer;
  font-size: 18px;      /* 原本 14 → 18 */
}


.btn.primary {
  background: #ffd27a;
  color: #7a0a0a;
}
</style>
