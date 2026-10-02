import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the built site works from any folder or file host.
  base: "./",
  build: { target: "es2022", chunkSizeWarningLimit: 1500 },
});
