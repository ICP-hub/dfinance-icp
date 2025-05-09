/// <reference types="vitest" />
import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import environment from "vite-plugin-environment";
import dotenv from "dotenv";
import viteCompression from "vite-plugin-compression";

dotenv.config({ path: "../../.env" });

export default defineConfig({
  build: {
    emptyOutDir: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
     allowedHosts: ["8f1c-2409-40c2-3055-5b49-942c-e27b-2b05-27c5.ngrok-free.app"],
  },
  plugins: [
    react(),
    viteCompression({
      algorithm: "brotliCompress",
      verbose: true,
      threshold: 1024,
      deleteOriginFile: false,
    }),
    viteCompression({
      algorithm: "gzip",
      verbose: true,
      threshold: 1024,
      deleteOriginFile: false,
    }),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: "src/setupTests.js",
  },
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
    ],
  },
 
});
