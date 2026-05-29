import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_CLERK_PUBLISHABLE_KEY"];
  const missing = required.filter((k) => !env[k]);
  if (missing.length > 0) {
    console.warn(`[vite] Missing environment variables: ${missing.join(", ")} — add them to src/frontend/.env`);
  }

  return {
  build: {
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
  },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(env.VITE_CLERK_PUBLISHABLE_KEY),
  },
  css: {
    postcss: "./postcss.config.js",
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    host: true,
  },
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
  };
});
