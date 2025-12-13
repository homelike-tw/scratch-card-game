<script setup lang="ts">
import ScratchCard from "./components/ScratchCard.vue"
import ResultModal from "./components/ResultModal.vue"
import { computed, ref } from "vue"

const isRevealed = ref(false)

/** Modal 狀態 */
const modalOpen = ref(false)
const modalStore = ref("")
const modalName = ref("")
const modalAmount = ref(0)

/** 表單是否已通過送出（解鎖刮刮樂） */
const isFormApproved = ref(false)

const form = ref({
  store: "",
  name: "",
  agree: false
})

/** 用來強制重建 ScratchCard（reset 用） */
const scratchKey = ref(0)

/** 中獎金額設定 */
const PRIZES = [188, 288, 388, 588] as const

/** 本次刮中的金額（送出後就固定） */
const prizeNumber = ref<number | null>(null)

/** 隨機抽一個金額 */
const generatePrizeNumber = () => {
  const index = Math.floor(Math.random() * PRIZES.length)
  prizeNumber.value = PRIZES[index]! // 保證不會是 undefined
}

/** 三項必填/必勾 */
const isFormValid = computed(() => {
  return !!form.value.store.trim() && !!form.value.name.trim() && form.value.agree
})

/** 是否允許開始刮（必須先送出成功 + 尚未刮開） */
const canScratch = computed(() => {
  return isFormApproved.value && !isRevealed.value
})

/** 刮開完成 */
const handleRevealed = () => {
  isRevealed.value = true

  // 保險：若尚未產生金額，這裡補產生一次
  if (prizeNumber.value == null) generatePrizeNumber()

  modalStore.value = form.value.store.trim()
  modalName.value = form.value.name.trim()
  modalAmount.value = prizeNumber.value ?? 0
  modalOpen.value = true
}

/** 阻擋刮刮樂時的提示 */
const getBlockReason = (): string => {
  if (!isFormApproved.value) {
    if (!form.value.store.trim() || !form.value.name.trim()) {
      return "請先填寫門市據點與顧客姓名，即可參加刮刮樂。"
    }
    if (!form.value.agree) {
      return "請先勾選「已在實體店面消費滿 10,000 元」。"
    }
    return "請先按下「送出」完成驗證，才可以開始刮。"
  }

  if (isRevealed.value) {
    return "刮刮樂已完成，不需要再次刮。"
  }

  return "目前不可刮。"
}

const handleScratchBlockedClick = () => {
  alert(getBlockReason())
}

/** 送出表單 */
const handleSubmit = () => {
  if (!form.value.store.trim() || !form.value.name.trim()) {
    alert("請填寫門市據點與顧客姓名")
    return
  }
  if (!form.value.agree) {
    alert("請勾選「已在實體店面消費滿 10,000 元」")
    return
  }

  isFormApproved.value = true

  // 送出時就先固定本次金額
  generatePrizeNumber()
}

/** 下一位顧客（只由 Modal 的 Play again 觸發） */
const resetForNextCustomer = () => {
  form.value = {
    store: "",
    name: "",
    agree: false
  }

  isFormApproved.value = false
  isRevealed.value = false
  prizeNumber.value = null

  // 一併重置 modal 狀態（避免殘留）
  modalOpen.value = false
  modalStore.value = ""
  modalName.value = ""
  modalAmount.value = 0

  // 強制重新建立 ScratchCard
  scratchKey.value++
}
</script>

<template>
  <div class="page">
    <!-- 舞台：鎖定背景圖比例，所有定位都以 stage 為座標系 -->
    <div class="stage">
      <img class="bg" src="/background.jpg" alt="event bg" />

      <!-- 刮刮樂區 -->
      <div class="scratch-area">
        <ScratchCard
          :key="scratchKey"
          :width="280"
          :height="180"
          :scratchRadius="24"
          :revealPercent="55"
          coverColor="#c0c0c0"
          :disabled="!canScratch"
          @revealed="handleRevealed"
        >
          <div class="prize">
            <template v-if="isFormApproved && prizeNumber != null">
              現折 {{ prizeNumber }} 元
            </template>
            <template v-else>刮開揭曉</template>
          </div>
        </ScratchCard>

        <div
          v-if="!canScratch"
          class="scratch-lock"
          @click.stop.prevent="handleScratchBlockedClick"
        />
      </div>

      <!-- 表單區 -->
      <form class="form-area" @submit.prevent="handleSubmit">
        <input
          v-model="form.store"
          class="form-input"
          type="text"
          placeholder="門市據點（必填）"
          :disabled="isFormApproved"
        />
        <input
          v-model="form.name"
          class="form-input"
          type="text"
          placeholder="顧客姓名（必填）"
          :disabled="isFormApproved"
        />

        <label class="checkbox-line">
          <input v-model="form.agree" type="checkbox" :disabled="isFormApproved" />
          <span>我已在實體店面消費滿 10,000 元（必勾）</span>
        </label>

        <button class="image-btn" type="submit" :disabled="isFormApproved || !isFormValid">
          <img src="/button.png" alt="輕輕一刮，刮出你的新年好運" />
        </button>
      </form>
    </div>

    <!-- Modal -->
    <ResultModal
      :open="modalOpen"
      :store="modalStore"
      :name="modalName"
      :amount="modalAmount"
      @restart="() => { modalOpen = false; resetForNextCustomer() }"
    />
  </div>
</template>

<style scoped>
/* 讓整個舞台置中，且不因瀏覽器差異跑版 */
.page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: grid;
  place-items: center;
  font-family: "Noto Sans TC", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

/**
 * 舞台：固定比例（請依 background.jpg 真實比例調整）
 * 目前先用 16:9
 */
.stage {
  position: relative;
  aspect-ratio: 16 / 9;
  width: min(100vw, calc(100vh * (16 / 9)));
  height: auto;
}

/* 背景圖滿版舞台（避免 contain 留白造成定位錯位） */
.bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* =========================
   刮刮樂定位（以 stage 為座標系）
   ========================= */
.scratch-area {
  position: absolute;

  /* 這兩個是「灰色窗框中心點」的比例座標（你再微調即可） */
  left: 27.5%;
  top: 57.2%;

  /* 把元素中心點對齊 left/top */
  transform: translate(-50%, -50%);

  /* 刮刮樂大小 */
  width: 280px;
  height: 180px;
}

.prize {
  font-size: 22px;
  font-weight: 700;
  color: #d62f2f;
  text-align: center;
  padding-top: 50px;
}

/* 阻擋層：覆蓋整個刮刮樂 */
.scratch-lock {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.08);
  cursor: not-allowed;
}

/* =========================
   表單定位（以 stage 為座標系）
   ========================= */
.form-area {
  position: absolute;

  /* 右側表單區大致中心點（你再微調即可） */
  left: 72%;
  top: 52%;
  transform: translate(-50%, -50%);

  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-input {
  padding: 10px 16px;
  border-radius: 999px;
  border: none;
  font-size: 16px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
}

.checkbox-line {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 14px;
}

.image-btn {
  border: none;
  background: transparent;
  cursor: pointer;
}

.image-btn img {
  width: 100%;
  display: block;
}

.image-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
