import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        tms: resolve(__dirname, "tms.html"),
      },
    },
  },
  server: {
    port: 4200,
    host: "127.0.0.1",
  },
});
