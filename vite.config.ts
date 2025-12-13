import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  plugins: [vue()],
  // GitHub Pages (Project Pages) 必須設 repo 名
  base: "/scratch-card-game/",
})
