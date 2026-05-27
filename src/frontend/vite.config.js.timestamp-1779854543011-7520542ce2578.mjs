// vite.config.js
import { fileURLToPath, URL } from "url";
import react from "file:///home/project/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21/node_modules/@vitejs/plugin-react/dist/index.js";
import { defineConfig } from "file:///home/project/node_modules/.pnpm/vite@5.4.21_@types+node@20.19.41/node_modules/vite/dist/node/index.js";
import environment from "file:///home/project/node_modules/.pnpm/vite-plugin-environment@1.1.3_vite@5.4.21/node_modules/vite-plugin-environment/dist/index.js";
var __vite_injected_original_import_meta_url = "file:///home/project/src/frontend/vite.config.js";
var ii_url = process.env.DFX_NETWORK === "local" ? `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:8081/` : `https://identity.internetcomputer.org/`;
process.env.II_URL = process.env.II_URL || ii_url;
process.env.STORAGE_GATEWAY_URL = process.env.STORAGE_GATEWAY_URL || "https://blob.caffeine.ai";
var vite_config_default = defineConfig({
  logLevel: "error",
  build: {
    emptyOutDir: true,
    sourcemap: false,
    minify: false
  },
  css: {
    postcss: "./postcss.config.js"
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis"
      }
    }
  },
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true
      }
    }
  },
  plugins: [
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
    environment(["II_URL"]),
    environment(["STORAGE_GATEWAY_URL"]),
    react()
  ],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", __vite_injected_original_import_meta_url))
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
      }
    ],
    dedupe: ["@dfinity/agent"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NyYy9mcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zcmMvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zcmMvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tIFwidXJsXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IGVudmlyb25tZW50IGZyb20gXCJ2aXRlLXBsdWdpbi1lbnZpcm9ubWVudFwiO1xuXG5jb25zdCBpaV91cmwgPVxuICBwcm9jZXNzLmVudi5ERlhfTkVUV09SSyA9PT0gXCJsb2NhbFwiXG4gICAgPyBgaHR0cDovL3JkbXg2LWphYWFhLWFhYWFhLWFhYWRxLWNhaS5sb2NhbGhvc3Q6ODA4MS9gXG4gICAgOiBgaHR0cHM6Ly9pZGVudGl0eS5pbnRlcm5ldGNvbXB1dGVyLm9yZy9gO1xuXG5wcm9jZXNzLmVudi5JSV9VUkwgPSBwcm9jZXNzLmVudi5JSV9VUkwgfHwgaWlfdXJsO1xucHJvY2Vzcy5lbnYuU1RPUkFHRV9HQVRFV0FZX1VSTCA9XG4gIHByb2Nlc3MuZW52LlNUT1JBR0VfR0FURVdBWV9VUkwgfHwgXCJodHRwczovL2Jsb2IuY2FmZmVpbmUuYWlcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgbG9nTGV2ZWw6IFwiZXJyb3JcIixcbiAgYnVpbGQ6IHtcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIG1pbmlmeTogZmFsc2UsXG4gIH0sXG4gIGNzczoge1xuICAgIHBvc3Rjc3M6IFwiLi9wb3N0Y3NzLmNvbmZpZy5qc1wiLFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBlc2J1aWxkT3B0aW9uczoge1xuICAgICAgZGVmaW5lOiB7XG4gICAgICAgIGdsb2JhbDogXCJnbG9iYWxUaGlzXCIsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IHRydWUsXG4gICAgcHJveHk6IHtcbiAgICAgIFwiL2FwaVwiOiB7XG4gICAgICAgIHRhcmdldDogXCJodHRwOi8vMTI3LjAuMC4xOjQ5NDNcIixcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgZW52aXJvbm1lbnQoXCJhbGxcIiwgeyBwcmVmaXg6IFwiQ0FOSVNURVJfXCIgfSksXG4gICAgZW52aXJvbm1lbnQoXCJhbGxcIiwgeyBwcmVmaXg6IFwiREZYX1wiIH0pLFxuICAgIGVudmlyb25tZW50KFtcIklJX1VSTFwiXSksXG4gICAgZW52aXJvbm1lbnQoW1wiU1RPUkFHRV9HQVRFV0FZX1VSTFwiXSksXG4gICAgcmVhY3QoKSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiBbXG4gICAgICB7XG4gICAgICAgIGZpbmQ6IFwiZGVjbGFyYXRpb25zXCIsXG4gICAgICAgIHJlcGxhY2VtZW50OiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoXCIuLi9kZWNsYXJhdGlvbnNcIiwgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBmaW5kOiBcIkBcIixcbiAgICAgICAgcmVwbGFjZW1lbnQ6IGZpbGVVUkxUb1BhdGgobmV3IFVSTChcIi4vc3JjXCIsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgfSxcbiAgICBdLFxuICAgIGRlZHVwZTogW1wiQGRmaW5pdHkvYWdlbnRcIl1cbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFnUSxTQUFTLGVBQWUsV0FBVztBQUNuUyxPQUFPLFdBQVc7QUFDbEIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxpQkFBaUI7QUFIb0ksSUFBTSwyQ0FBMkM7QUFLN00sSUFBTSxTQUNKLFFBQVEsSUFBSSxnQkFBZ0IsVUFDeEIsdURBQ0E7QUFFTixRQUFRLElBQUksU0FBUyxRQUFRLElBQUksVUFBVTtBQUMzQyxRQUFRLElBQUksc0JBQ1YsUUFBUSxJQUFJLHVCQUF1QjtBQUVyQyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixVQUFVO0FBQUEsRUFDVixPQUFPO0FBQUEsSUFDTCxhQUFhO0FBQUEsSUFDYixXQUFXO0FBQUEsSUFDWCxRQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsS0FBSztBQUFBLElBQ0gsU0FBUztBQUFBLEVBQ1g7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLGdCQUFnQjtBQUFBLE1BQ2QsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLFlBQVksT0FBTyxFQUFFLFFBQVEsWUFBWSxDQUFDO0FBQUEsSUFDMUMsWUFBWSxPQUFPLEVBQUUsUUFBUSxPQUFPLENBQUM7QUFBQSxJQUNyQyxZQUFZLENBQUMsUUFBUSxDQUFDO0FBQUEsSUFDdEIsWUFBWSxDQUFDLHFCQUFxQixDQUFDO0FBQUEsSUFDbkMsTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixhQUFhLGNBQWMsSUFBSSxJQUFJLG1CQUFtQix3Q0FBZSxDQUFDO0FBQUEsTUFDeEU7QUFBQSxNQUNBO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixhQUFhLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLE1BQzlEO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUSxDQUFDLGdCQUFnQjtBQUFBLEVBQzNCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
