import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        tms: resolve(__dirname, "index.html"),
        inventario: resolve(__dirname, "inventario.html"),
      },
    },
  },
  server: {
    port: 4200,
    host: "127.0.0.1",
  },
});
