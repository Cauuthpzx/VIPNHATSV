import { resolve } from "node:path";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@layui/layui-vue": resolve(__dirname, "../packages/component/index"),
      "@layui/layer-vue": resolve(__dirname, "../packages/layer"),
      "@layui/icons-vue": resolve(__dirname, "../packages/icons"),
    },
  },
  server: {
    port: 1754,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:3000",
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ["vue", "vue-router", "pinia"],
          layui: ["@layui/layui-vue"],
        },
      },
    },
  },
});
