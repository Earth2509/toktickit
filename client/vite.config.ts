import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? "http://localhost:3000";
const apiProxy = {
  "/api": {
    target: apiProxyTarget,
    changeOrigin: false,
  },
};

export default defineConfig({
  plugins: [react()],
  resolve: { preserveSymlinks: process.env.VITE_PRESERVE_SYMLINKS === "true" },
  server: { port: 5173, proxy: apiProxy },
  preview: { port: 4173, proxy: apiProxy },
  test: {
    environment: "jsdom",
    globals: true,
    css: true,
    setupFiles: "./tests/setup.ts",
    include: ["tests/**/*.test.tsx"],
  },
});
