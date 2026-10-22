import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // WSL /mnt/c mounts may not emit filesystem events; ignore generated and vendor trees.
  server: {
    port: 5173,
    watch: {
      usePolling: true,
      interval: 500,
      ignored: ["**/.venv/**", "**/artifacts/**", "**/cache/**", "**/test-results/**"],
    },
  },
  build: {
    rollupOptions: { output: { manualChunks: { wallet: ["ethers"] } } },
  },
});
