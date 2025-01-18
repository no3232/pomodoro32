import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: "src/electron/main.ts",
      },
      preload: {
        input: "src/electron/preload.ts",
      },
      renderer: {},
    }),
  ],
  build: {
    outDir: "dist-react",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src/ui"),
    },
  },
  base: "./",
  server: {
    port: 3000,
    host: true,
  },
});
